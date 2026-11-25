"use strict";
// Run with: node --test functions/test/snacks.test.js
// Loads the snack Lambdas with a fake aws-sdk DocumentClient (no AWS access needed).
const test = require("node:test");
const assert = require("node:assert");
const Module = require("module");
const path = require("path");

let calls;
let responses;
const fakeSdk = {
  DynamoDB: {
    DocumentClient: class {
      constructor() {
        ["get", "query", "update", "delete", "put", "transactWrite"].forEach((op) => {
          this[op] = (params) => ({
            promise: () => {
              calls.push({ op, params });
              const r = responses[op];
              const out = typeof r === "function" ? r(params) : r;
              return out instanceof Error ? Promise.reject(out) : Promise.resolve(out || {});
            }
          });
        });
      }
    }
  }
};
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  return request === "aws-sdk" ? fakeSdk : originalLoad.call(this, request, ...rest);
};

process.env.SNACKS_TABLE = "Snacks";
process.env.SNACKS_CART_TABLE = "SnackCart";
process.env.SNACKS_ORDERS_TABLE = "SnackOrders";
const load = (name) => require(path.join(__dirname, "..", "APIs", name + ".js")).handler;
const event = (body) => ({
  body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  requestContext: { identity: { cognitoIdentityId: "user1" } }
});
const invoke = (handler, ev, ctx) => new Promise((resolve) => handler(ev, ctx || { awsRequestId: "req" }, (e, r) => resolve(r)));
const conditionError = () => Object.assign(new Error("cond"), { code: "ConditionalCheckFailedException" });

test.beforeEach(() => { calls = []; responses = {}; });

test("addSnackToCart rejects bad bodies and quantities with 400", async () => {
  const h = load("addSnackToCart");
  for (const b of [undefined, "not json", {}, { snackId: "s1", quantity: 0 }, { snackId: "s1", quantity: 1.5 },
    { snackId: "s1", quantity: 100 }, { snackId: "s1", quantity: "2" }]) {
    assert.strictEqual((await invoke(h, event(b))).statusCode, 400);
  }
  assert.strictEqual(calls.length, 0);
});

test("addSnackToCart uses the catalog price, not a client price", async () => {
  responses.get = { Item: { id: "s1", price: 2.5 } };
  const res = await invoke(load("addSnackToCart"), event({ snackId: "s1", quantity: 2, price: 0 }));
  assert.strictEqual(res.statusCode, 200);
  const update = calls.find((c) => c.op === "update").params;
  assert.strictEqual(update.ExpressionAttributeValues[":price"], 2.5);
  assert.strictEqual(update.ExpressionAttributeValues[":quantity"], 2);
  assert.strictEqual(update.Key.customerId, "user1");
});

test("addSnackToCart returns 404 for unknown snacks and 400 above the cap", async () => {
  responses.get = {};
  assert.strictEqual((await invoke(load("addSnackToCart"), event({ snackId: "x", quantity: 1 }))).statusCode, 404);
  responses.get = { Item: { id: "s1", price: 1 } };
  responses.update = conditionError();
  assert.strictEqual((await invoke(load("addSnackToCart"), event({ snackId: "s1", quantity: 1 }))).statusCode, 400);
});

test("updateSnackCart validates and does not create missing rows", async () => {
  const h = load("updateSnackCart");
  assert.strictEqual((await invoke(h, event({ snackId: "s1", quantity: -1 }))).statusCode, 400);
  assert.strictEqual((await invoke(h, event("{"))).statusCode, 400);
  responses.update = conditionError();
  assert.strictEqual((await invoke(h, event({ snackId: "s1", quantity: 2 }))).statusCode, 404);
  assert.strictEqual(calls[0].params.ConditionExpression, "attribute_exists(snackId)");
});

test("removeSnackFromCart validates and deletes by identity", async () => {
  const h = load("removeSnackFromCart");
  assert.strictEqual((await invoke(h, event(undefined))).statusCode, 400);
  assert.strictEqual((await invoke(h, event({ snackId: "s1" }))).statusCode, 200);
  assert.deepStrictEqual(calls[0].params.Key, { customerId: "user1", snackId: "s1" });
});

test("checkoutSnacks requires an idempotency key", async () => {
  assert.strictEqual((await invoke(load("checkoutSnacks"), event({}))).statusCode, 400);
  assert.strictEqual((await invoke(load("checkoutSnacks"), event({ idempotencyKey: "short" }))).statusCode, 400);
});

test("checkoutSnacks prices from the catalog and writes order and cart deletes in one transaction", async () => {
  responses.query = { Items: [{ snackId: "s1", quantity: 2, price: 0 }, { snackId: "s2", quantity: 1, price: 0 }] };
  responses.get = (p) => (p.TableName === "SnackOrders" ? {} : { Item: { id: p.Key.id, name: "N" + p.Key.id, price: p.Key.id === "s1" ? 2.5 : 3 } });
  const res = await invoke(load("checkoutSnacks"), event({ idempotencyKey: "key-12345678", snacks: [{ snackId: "s1", price: 0, quantity: 1 }] }));
  assert.strictEqual(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.total, 8);
  assert.strictEqual(body.orderId, "key-12345678");
  const items = calls.find((c) => c.op === "transactWrite").params.TransactItems;
  assert.strictEqual(items.length, 3);
  assert.strictEqual(items[0].Put.Item.snacks[0].price, 2.5);
  assert.ok(items.slice(1).every((i) => i.Delete));
});

test("checkoutSnacks is idempotent and rejects empty carts and cart races", async () => {
  const h = load("checkoutSnacks");
  const ev = () => event({ idempotencyKey: "key-12345678" });
  responses.get = { Item: { orderId: "key-12345678", total: 5 } };
  assert.strictEqual((await invoke(h, ev())).statusCode, 200);
  assert.ok(!calls.some((c) => c.op === "transactWrite"));
  responses.get = {};
  responses.query = { Items: [] };
  assert.strictEqual((await invoke(h, ev())).statusCode, 400);
  responses.query = { Items: [{ snackId: "s1", quantity: 1 }] };
  responses.get = (p) => (p.TableName === "SnackOrders" ? {} : { Item: { id: "s1", name: "n", price: 1 } });
  responses.transactWrite = Object.assign(new Error("x"), { code: "TransactionCanceledException" });
  assert.strictEqual((await invoke(h, ev())).statusCode, 409);
});

test("handlers short-circuit on warmer events", async () => {
  const res = await new Promise((resolve) => load("checkoutSnacks")({ source: "warmer" }, {}, (e, r) => resolve(r)));
  assert.strictEqual(res, "Lambda is warm");
});
