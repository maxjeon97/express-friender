"use strict";

const db = require('../db');

/** Viewed User Model. */

class ViewedUser {

  /** Inserts a view from one user to another in the database
   *
   * returns true if both users match, returns false otherwise
   */
  static async addViewAndCheckMatch(viewingUsername, viewedUsername, liked) {
    await db.query(
      `INSERT INTO viewed_users (
        viewing_username,
        viewed_username,
        liked)
        VALUES ($1, $2, $3)`,
        [viewingUsername, viewedUsername, liked]
    );

    if(!liked) return false;

    const results = await db.query(
      `SELECT liked
        FROM viewed_users
        WHERE viewing_username = $1
        AND viewed_username = $2`,
        [viewedUsername, viewingUsername]
    );

    if(results.rows.length === 0 || results.rows[0] === false) {
      return false;
    } else {
      return true;
    }
  }
}

module.exports = ViewedUser;