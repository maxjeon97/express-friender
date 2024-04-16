"use strict";

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");
const { getZipCodesInRadius } = require("../zipCodeApi");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {
   *      username,
   *      firstName,
   *      lastName,
   *      hobbies,
   *      interests,
   *      location,
   *      friendRadius
   *    }
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
   * [{username, firstName, lastName}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username,
              first_name AS firstName,
              last_name AS lastName
      FROM users
      ORDER BY username`
    );

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          firstName,
   *          lastName,
   *          hobbies,
   *          interests,
   *          location,
   *          friendRadius } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
              first_name AS firstName,
              last_name AS lastName,
              hobbies,
              interests,
              location,
              friend_radius AS friendRadius,
              last_searched AS lastSearched,
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
    };

    return user;
  }

  static async getViewableUsers({ username, location, friendRadius }) {
    const locations = await getZipCodesInRadius(location, friendRadius);
    const zipCodes = locations.map(l => l.zip_code);

    const results = await db.query(
      `SELECT first_name AS firstName,
              last_name AS lastName,
              hobbies,
              interests,
              location
        FROM users AS u
        JOIN viewed_users AS v ON(v.viewed_username = u.username)
        WHERE location in $1
        AND v.viewing_username <> $2`,
      [zipCodes, username]
    );

    const users = results.rows.map(u => ({
      ...u,
      area: {
        distance: locations.filter(l => l.zip_code === u.location)[0].distance,
        city: locations.filter(l => l.zip_code === u.location)[0].city,
        state: locations.filter(l => l.zip_code === u.location)[0].state,
        zipCode: locations.filter(l => l.zip_code === u.location)[0].zip_code,
      }
    }));

    return users;
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
        toUser: {
          username: m.to_username,
          firstName: m.first_name,
          lastName: m.last_name
        },
        body: m.body,
        sentAt: m.sent_at,
        readAt: m.read_at
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
        fromUser: {
          username: m.from_username,
          firstName: m.first_name,
          lastName: m.last_name
        },
        body: m.body,
        sentAt: m.sent_at,
        readAt: m.read_at
      };
    });

    return messageData;
  }
}


module.exports = User;