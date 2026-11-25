"use strict";

const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
};
const send = (callback, statusCode, data) => callback(null, {
  statusCode: statusCode, headers: headers, body: data === undefined ? undefined : JSON.stringify(data)
});
const respond = (callback, error, data) => error
  ? send(callback, error.code === "ConditionalCheckFailedException" ? 404 : 500, { message: error.message })
  : send(callback, 200, data);
const parse = (event) => { try { return JSON.parse(event.body) || {}; } catch (e) { return {}; } };
const validQuantity = (q) => Number.isInteger(q) && q >= 1 && q <= 99;

// CheckoutSnacks - Turn the snack cart of a customer into a snack order, priced from the catalog
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const key = parse(event).idempotencyKey;
  if (typeof key !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(key)) {
    return send(callback, 400, { message: "idempotencyKey is required" });
  }
  const customerId = event.requestContext.identity.cognitoIdentityId;
  const ordersTable = process.env.SNACKS_ORDERS_TABLE; // [ProjectName]-SnackOrders
  const cartTable = process.env.SNACKS_CART_TABLE; // [ProjectName]-SnackCart
  // A retry with the same key returns the order already saved
  dynamoDb.get({ TableName: ordersTable, Key: { customerId: customerId, orderId: key } }).promise()
    .then((done) => done.Item ? send(callback, 200, done.Item) : dynamoDb.query({
      TableName: cartTable,
      KeyConditionExpression: "customerId = :customerId",
      ExpressionAttributeValues: { ":customerId": customerId }
    }).promise().then((cart) => {
      if (cart.Items.length === 0) return send(callback, 400, { message: "The cart is empty" });
      return Promise.all(cart.Items.map((i) => dynamoDb.get({
        TableName: process.env.SNACKS_TABLE, Key: { id: i.snackId } // [ProjectName]-Snacks
      }).promise())).then((found) => {
        const missing = found.findIndex((f) => !f.Item);
        if (missing >= 0) return send(callback, 400, { message: "Snack unavailable: " + cart.Items[missing].snackId });
        const lines = cart.Items.map((i, n) => ({
          snackId: i.snackId, name: found[n].Item.name, quantity: i.quantity, price: found[n].Item.price
        }));
        const order = {
          customerId: customerId, orderId: key, orderDate: Date.now(), snacks: lines,
          total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
        };
        // One transaction: save the order and clear exactly the items that were priced
        return dynamoDb.transactWrite({
          TransactItems: [{ Put: { TableName: ordersTable, Item: order, ConditionExpression: "attribute_not_exists(orderId)" } }]
            .concat(cart.Items.map((i) => ({ Delete: {
              TableName: cartTable,
              Key: { customerId: customerId, snackId: i.snackId },
              ConditionExpression: "quantity = :quantity",
              ExpressionAttributeValues: { ":quantity": i.quantity }
            } })))
        }).promise().then(() => send(callback, 200, order));
      });
    }))
    .catch((error) => error.code === "TransactionCanceledException"
      ? send(callback, 409, { message: "The cart changed, try again" })
      : respond(callback, error));
};
