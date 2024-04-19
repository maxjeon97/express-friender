const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

const DB_URI = getDatabaseUri();

const db = new Client({
  connectionString: DB_URI
});

async function connectDb() {
  // Jest replaces console.* with custom methods; get the real ones for this
  const { log, error } = require("console");
  try {
    await db.connect();
    log(`Connected to ${DB_URI}`);
  } catch(err) /* istanbul ignore next (ignore for coverage) */ {
    error(`Couldn't connect to ${DB_URI}`, err.message);
    process.exit(1);
  }
}

connectDb();

module.exports = db;