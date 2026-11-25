"use strict";

const AWS = require("aws-sdk");
const response = require("cfn-response"); // available to inline (ZipFile) Lambda code
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// UploadSnacks - Seed the snacks table with a sample set of snacks
const snacks = [
  ["Potato Chips", "Salty", "Classic salted potato chips", 3.5],
  ["Popcorn", "Salty", "Buttered popcorn", 3],
  ["Pretzels", "Salty", "Crunchy baked pretzels", 2.75],
  ["Mixed Nuts", "Salty", "Roasted almonds, cashews and peanuts", 5],
  ["Chocolate Bar", "Sweet", "Milk chocolate bar", 2.5],
  ["Gummy Bears", "Sweet", "Fruit flavored gummy bears", 2],
  ["Chocolate Cookies", "Sweet", "Cookies with chocolate chips", 3.25],
  ["Granola Bar", "Healthy", "Oats, honey and almonds", 2.25],
  ["Dried Mango", "Healthy", "Unsweetened dried mango slices", 4.5],
  ["Sparkling Water", "Drinks", "Lemon flavored sparkling water", 1.75],
  ["Iced Tea", "Drinks", "Peach iced tea", 2.5],
  ["Orange Juice", "Drinks", "Fresh squeezed orange juice", 3.75]
];

exports.handler = (event, context, callback) => {
  if (event.RequestType !== "Create") {
    return response.send(event, context, response.SUCCESS);
  }
  const items = snacks.map((s, i) => ({
    PutRequest: { Item: { id: "snack-" + (i + 1), name: s[0], category: s[1], description: s[2], price: s[3] } }
  }));
  dynamoDb.batchWrite({ RequestItems: { [process.env.TABLE_NAME]: items } }).promise() // [ProjectName]-Snacks
    .then(() => response.send(event, context, response.SUCCESS))
    .catch((error) => {
      console.log(error);
      response.send(event, context, response.FAILED, { Error: "Upload snacks failed" });
    });
};
