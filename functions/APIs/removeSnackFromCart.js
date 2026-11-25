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

// RemoveSnackFromCart - Remove a snack from the snack cart of a customer
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const data = parse(event);
  if (typeof data.snackId !== "string") {
    return send(callback, 400, { message: "snackId is required" });
  }
  const params = {
    TableName: process.env.SNACKS_CART_TABLE, // [ProjectName]-SnackCart
    Key: {
      customerId: event.requestContext.identity.cognitoIdentityId,
      snackId: data.snackId
    }
  };
  dynamoDb.delete(params).promise()
    .then(() => respond(callback, null))
    .catch((error) => respond(callback, error));
};
