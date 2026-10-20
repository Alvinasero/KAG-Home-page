const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const url = (process.env.MONGO_URI || "").trim();

if (!url) {
  throw new Error("Missing MONGO_URI in Backend/.env");
}

const client = new MongoClient(url);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(process.env.MONGO_DB_NAME || "kag_maridadi");
    return db;

  } catch (err) {
    console.error("Connection failed:", err);
  }
}

module.exports = connectDB;
