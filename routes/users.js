"use strict";

const Router = require("express").Router;
const router = new Router();


const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const User = require('../models/user');


/** GET / - get list of users.
 *
 * => {users: [{username, firstName, lastName}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async function (req, res, next) {
  const users = await User.all();
  return res.json({ users });
});


/** GET /:username - get detail of users.
 *
 * => {user: {username, firstName, lastName, hobbies, interests, location, friendRadius}}
 *
 **/

router.get('/:username', ensureCorrectUser, async function (req, res, next) {
  const user = await User.get(req.params.username);
  return res.json({ user });
});


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sentAt,
 *                 readAt,
 *                 fromUser: {username, firstName, lastName}}, ...]}
 *
 **/

router.get('/:username/to', ensureCorrectUser, async function (req, res, next) {
  const messages = await User.messagesTo(req.params.username);
  return res.json({ messages });
});


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sentAt,
 *                 readAt,
 *                 toUser: {username, firstName, lastName}}, ...]}
 *
 **/

router.get('/:username/from', ensureCorrectUser, async function (req, res, next) {
  const messages = await User.messagesFrom(req.params.username);
  return res.json({ messages });
});


module.exports = router;