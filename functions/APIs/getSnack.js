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

// GetSnack - Get a snack by id
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const params = {
    TableName: process.env.SNACKS_TABLE, // [ProjectName]-Snacks
    Key: { id: event.pathParameters.id }
  };
  dynamoDb.get(params).promise()
    .then((data) => data.Item
      ? respond(callback, null, data.Item)
      : callback(null, { statusCode: 404, headers: headers, body: JSON.stringify({ message: "Snack not found" }) }))
    .catch((error) => respond(callback, error));
};
