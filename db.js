const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test"
    ? "postgresql:///friender_test"
    : "postgresql:///friender";

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;