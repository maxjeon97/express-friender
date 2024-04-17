"use strict";

/** Message class for message.ly */

const db = require('../db');

/** Message on the site. */

class Message {

  /** Register new message -- returns
   *    {id, fromUsername, toUsername, body, sentAt}
   */

  static async create({ fromUsername, toUsername, body }) {
    const result = await db.query(
          `INSERT INTO messages (from_username,
                                 to_username,
                                 body,
                                 sent_at)
             VALUES
               ($1, $2, $3, current_timestamp)
             RETURNING id,
                       from_username AS "fromUsername",
                       to_username AS "toUsername",
                       body,
                       sent_at AS "sentAt"`,
        [fromUsername, toUsername, body]);

    return result.rows[0];
  }

  /** Update read_at for message
   *
   * updates the read_at property to the current timestamp
   *
   * returns {id, readAt}
   *
   **/

  static async markRead(id) {
    const result = await db.query(
          `UPDATE messages
           SET read_at = current_timestamp
             WHERE id = $1
             RETURNING id, read_at AS "readAt"`,
        [id]);
    const message = result.rows[0];

    if (!message) throw new NotFoundError(`No such message: ${id}`);

    return message;
  }

  /** Get: get message by id
   *
   * returns {id, fromUser, toUser, body, sentAt, readAt}
   *
   * both to_user and from_user = {username, firstName, lastName, phone}
   *
   */

  static async get(id) {
    const result = await db.query(
          `SELECT m.id,
                  m.from_username AS "fromUsername",
                  f.first_name AS "fromFirstName",
                  f.last_name AS "fromLastName",
                  m.to_username AS "toUsername",
                  t.first_name AS "toFirstName",
                  t.last_name AS "toLastName",
                  m.body,
                  m.sent_at AS "sentAt",
                  m.read_at AS "readAt"
             FROM messages AS m
                    JOIN users AS f ON m.from_username = f.username
                    JOIN users AS t ON m.to_username = t.username
             WHERE m.id = $1`,
        [id]);

    let m = result.rows[0];

    if (!m) throw new NotFoundError(`No such message: ${id}`);

    return {
      id: m.id,
      fromUser: {
        username: m.fromUsername,
        firstName: m.fromFirstName,
        lastName: m.fromLastName,
      },
      toUser: {
        username: m.toUsername,
        firstName: m.toFirstName,
        lastName: m.toLastName,
      },
      body: m.body,
      sentAt: m.sentAt,
      readAt: m.readAt,
    };
  }
}


module.exports = Message;
