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
                first_name AS "firstName",
                last_name AS "lastName",
                hobbies,
                interests,
                location,
                friend_radius AS "friendRadius"`,
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
              first_name AS "firstName",
              last_name AS "lastName"
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
   *          "imageUrl"
   *          hobbies,
   *          interests,
   *          location,
   *          friendRadius } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
              first_name AS "firstName",
              last_name AS "lastName",
              image_url AS "imageUrl",
              hobbies,
              interests,
              location,
              friend_radius AS "friendRadius",
              last_searched AS "lastSearched"
      FROM users
      WHERE username = $1`,
      [username]
    );
    console.log("*******************", results.rows[0]);

    if (!results.rows[0]) {
      throw new NotFoundError(`Cannot find user: ${username}`);
    }

    const user = results.rows[0];

    return user;
  }

  /**GET: returns users that are viewable by the user sending the request
   *
   * returns [{firstName,
   *           lastName,
   *           "imageUrl"
   *           hobbies,
   *           interests,
   *           location}, ...]
   */
  static async getViewableUsers(username, location, friendRadius) {
    const locations = await getZipCodesInRadius(location, friendRadius);
    const zipCodes = locations.map(l => l.zip_code);
    // const zipCodes = ["94510", "94563", "94512", "94581"];

    const results = await db.query(
      `SELECT first_name AS "firstName",
              last_name AS "lastName",
              image_url AS "imageUrl",
              hobbies,
              interests,
              location
        FROM users AS u
        LEFT OUTER JOIN viewed_users AS v ON(v.viewed_username = u.username)
        WHERE location = ANY ($1)
        AND u.username <> $2
        AND (v.viewing_username <> $2
        OR v.viewing_username IS NULL)`,
      [zipCodes, username]
    );

    console.log("**********************results", results.rows);

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


  //FIXME: refactor later if time

  /**Get all friends of user
   *
   * returns [{username,
   *           firstName,
   *           lastName,
   *           "imageUrl"}, ...]
   */
  static async getFriends(username) {
    const results1 = await db.query(
      `SELECT f.username1,
            u.first_name AS "firstName",
            u.last_name AS "lastName",
            u.image_url AS "imageUrl"
      FROM friends AS f
        JOIN users AS u ON (u.username = f.username1)
      WHERE f.username2 = $1`,
      [username]
    );

    const results2 = await db.query(
      `SELECT f.username2,
            u.first_name AS "firstName",
            u.last_name AS "lastName",
            u.image_url AS "imageUrl"
      FROM friends AS f
        JOIN users AS u ON (u.username = f.username2)
      WHERE f.username1 = $1`,
      [username]
    );

    return results1.rows.concat(results2.rows);
  }

  /**Adds friend relationship into the friends table in database
   */
  static async addFriend(username1, username2) {
    await db.query(
      `INSERT INTO friends (username1, username2)
        VALUES ($1, $2)`,
      [username1, username2]
    );

    return;
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
