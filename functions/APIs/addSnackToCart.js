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

// AddSnackToCart - Add a quantity of a snack to the snack cart of a customer (price comes from the catalog)
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const data = parse(event);
  if (typeof data.snackId !== "string" || !validQuantity(data.quantity)) {
    return send(callback, 400, { message: "snackId and an integer quantity from 1 to 99 are required" });
  }
  dynamoDb.get({
    TableName: process.env.SNACKS_TABLE, // [ProjectName]-Snacks
    Key: { id: data.snackId }
  }).promise()
    .then((snack) => {
      if (!snack.Item) return send(callback, 404, { message: "Snack not found" });
      return dynamoDb.update({
        TableName: process.env.SNACKS_CART_TABLE, // [ProjectName]-SnackCart
        Key: { customerId: event.requestContext.identity.cognitoIdentityId, snackId: data.snackId },
        UpdateExpression: "SET price = :price ADD quantity :quantity",
        ConditionExpression: "attribute_not_exists(quantity) OR quantity <= :max",
        ExpressionAttributeValues: { ":price": snack.Item.price, ":quantity": data.quantity, ":max": 99 - data.quantity }
      }).promise().then(() => respond(callback, null));
    })
    .catch((error) => error.code === "ConditionalCheckFailedException"
      ? send(callback, 400, { message: "Maximum of 99 per snack" })
      : respond(callback, error));
};
