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

// CheckoutSnacks - Turn the snack cart of a customer into a snack order
exports.handler = (event, context, callback) => {
  // Return immediately if being called by warmer
  if (event.source === "warmer") {
    return callback(null, "Lambda is warm");
  }
  const data = JSON.parse(event.body);
  const customerId = event.requestContext.identity.cognitoIdentityId;
  const order = {
    TableName: process.env.SNACKS_ORDERS_TABLE, // [ProjectName]-SnackOrders
    Item: {
      customerId: customerId,
      orderId: context.awsRequestId,
      orderDate: Date.now(),
      snacks: data.snacks
    }
  };
  // Save the order first, then remove the processed snacks from the cart
  dynamoDb.put(order).promise()
    .then(() => Promise.all(data.snacks.map((item) => dynamoDb.delete({
      TableName: process.env.SNACKS_CART_TABLE, // [ProjectName]-SnackCart
      Key: { customerId: customerId, snackId: item.snackId }
    }).promise())))
    .then(() => respond(callback, null))
    .catch((error) => respond(callback, error));
};
