"use strict";

/** Common config for friender */

// read .env files and make environmental variables

require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "secret";

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? "postgresql:///friender_test"
      : process.env.DATABASE_URL || "postgresql:///friender";
}

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};