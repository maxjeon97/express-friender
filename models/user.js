"use strict";

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({
    username,
    password,
    firstName,
    lastName,
    hobbies,
    interests,
    location,
    friendRadius
  }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        hobbies,
        interests,
        location,
        friend_radius)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING username,
                first_name AS firstName,
                last_name AS lastName,
                hobbies,
                interests,
                location,
                friend_radius AS friendRadius`,
      [username, hashedPassword, firstName, lastName, hobbies, interests, location, friendRadius]
    );
    return results.rows[0];

  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]
    );

    const user = results.rows[0];

    return user && await bcrypt.compare(password, user.password) === true;
  }

  //TODO: come back to this when we have more knowledge on filters
  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username,
              first_name,
              last_name
      FROM users
      ORDER BY username`
    );

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
              first_name AS firstName,
              last_name AS lastName,
              hobbies,
              interests,
              location,
              friend_radius as friendRadius
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (!results.rows[0]) {
      throw new NotFoundError(`Cannot find user: ${username}`);
    }

    /**separating hobbies and interests from a string with commas to an array
     * of values */
    const user = {
      ...results.rows[0],
      hobbies: results.rows[0].hobbies.split(", "),
      interests: results.rows[0].interests.split(", "),
    }

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id,
              m.to_username,
              u.first_name,
              u.last_name,
              m.body,
              m.sent_at,
              m.read_at
      FROM messages m
      JOIN users u ON(u.username = m.to_username)
      WHERE m.from_username = $1`,
      [username]
    );

    if (results.rows.length === 0) {
      throw new NotFoundError(`Cannot find user: ${username}`);
    }

    const messageData = results.rows.map(m => {
      return {
        id: m.id,
        to_user: {
          username: m.to_username,
          first_name: m.first_name,
          last_name: m.last_name
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      };
    });

    return messageData;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id,
              m.from_username,
              u.first_name,
              u.last_name,
              m.body,
              m.sent_at,
              m.read_at
      FROM messages m
      JOIN users u ON(u.username = m.from_username)
      WHERE m.to_username = $1`,
      [username]
    );

    if (results.rows.length === 0) {
      throw new NotFoundError(`Cannot find user: ${username}`);
    }

    const messageData = results.rows.map(m => {
      return {
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.first_name,
          last_name: m.last_name
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      };
    });

    return messageData;
  }
}


module.exports = User;
