"use strict";

const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
};
const respond = (callback, error, data) => callback(null, error
  ? { statusCode: 500, headers: headers, body: JSON.stringify({ message: error.message }) }
  : { statusCode: 200, headers: headers, body: data === undefined ? undefined : JSON.stringify(data) });

// AddSnackToCart - Add a snack to the snack cart of a customer
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.SNACKS_CART_TABLE, // [ProjectName]-SnackCart
    Item: {
      customerId: event.requestContext.identity.cognitoIdentityId,
      snackId: data.snackId,
      quantity: data.quantity,
      price: data.price
    }
  };
  dynamoDb.put(params).promise()
    .then(() => respond(callback, null))
    .catch((error) => respond(callback, error));
};
