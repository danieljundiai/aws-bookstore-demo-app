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

// ListSnacks - List all snacks, or only the snacks of a category
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const category = event.queryStringParameters && event.queryStringParameters.category;
  const params = category
    ? {
        TableName: process.env.SNACKS_TABLE, // [ProjectName]-Snacks
        IndexName: "category-index",
        KeyConditionExpression: "category = :category",
        ExpressionAttributeValues: { ":category": category }
      }
    : { TableName: process.env.SNACKS_TABLE };
  dynamoDb[category ? "query" : "scan"](params).promise()
    .then((data) => respond(callback, null, data.Items))
    .catch((error) => respond(callback, error));
};
