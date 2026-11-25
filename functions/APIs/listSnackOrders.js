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

// ListSnackOrders - List snack orders of a given customer
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const params = {
    TableName: process.env.SNACKS_ORDERS_TABLE, // [ProjectName]-SnackOrders
    KeyConditionExpression: "customerId = :customerId",
    ExpressionAttributeValues: {
      ":customerId": event.requestContext.identity.cognitoIdentityId
    }
  };
  dynamoDb.query(params).promise()
    .then((data) => respond(callback, null, data.Items))
    .catch((error) => respond(callback, error));
};
