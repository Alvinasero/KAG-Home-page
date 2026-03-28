const { MongoClient } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("myDatabase"); // database name
    return db;

  } catch (err) {
    console.error("Connection failed:", err);
  }
}

module.exports = connectDB;