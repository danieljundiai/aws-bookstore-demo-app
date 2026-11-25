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

// UpdateSnackCart - Update the quantity of a snack already in the snack cart of a customer
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const data = parse(event);
  if (typeof data.snackId !== "string" || !validQuantity(data.quantity)) {
    return send(callback, 400, { message: "snackId and an integer quantity from 1 to 99 are required" });
  }
  const params = {
    TableName: process.env.SNACKS_CART_TABLE, // [ProjectName]-SnackCart
    Key: {
      customerId: event.requestContext.identity.cognitoIdentityId,
      snackId: data.snackId
    },
    UpdateExpression: "SET quantity = :quantity",
    ConditionExpression: "attribute_exists(snackId)",
    ExpressionAttributeValues: { ":quantity": data.quantity }
  };
  dynamoDb.update(params).promise()
    .then(() => respond(callback, null))
    .catch((error) => respond(callback, error));
};
