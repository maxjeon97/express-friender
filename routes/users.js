"use strict";

const Router = require("express").Router;
const router = new Router();

// TODO: if we have time, add validation with jsonschema
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const User = require('../models/user');
const ViewedUser = require('../models/viewedUser');

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
 * => {user: {username, firstName, lastName, imageUrl, hobbies, interests, location, friendRadius}}
 *
 **/

router.get('/:username', ensureLoggedIn, async function (req, res, next) {
  const user = await User.get(req.params.username);
  const userFriends = await User.getFriends(req.params.username);
  user.friends = userFriends;
  return res.json({ user });
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, hobbies, interests, location, friendRadius, lastSearched }
 *
 * Returns { firstName, lastName, hobbies, interests, location, friendRadius, lastSearched }
 *
 * Authorization required: same user as username
 **/

router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
  const user = await User.update(req.params.username, req.body);
  return res.json({ user });
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: same user as username
 **/

router.delete("/:username", ensureCorrectUser, async function (req, res, next) {
  await User.remove(req.params.username);
  return res.json({ deleted: req.params.username });
});

/** GET /:username/viewable - get viewable users for username
 *
 * => { users: [{username, firstName, lastName, imageUrl, hobbies, interests, location, area}] }
 *
 **/

router.get('/:username/viewable', ensureCorrectUser, async function (req, res, next) {
  const { location, friendRadius } = req.query;
  const users =
    await User.getViewableUsers(req.params.username, location, friendRadius);

  return res.json({ users });
});

/**POST /:username/check-match - adds view, checks if match, adds friends
 * if matched
 *
 * => { matched: true|false }
 */

router.post('/:username/check-match', ensureCorrectUser, async function (req, res, next) {
  const { viewedUsername, liked } = req.body;
  const viewingUsername = req.params.username;

  const hasMatched =
    await ViewedUser.addViewAndCheckMatch(viewingUsername, viewedUsername, liked);

  if (hasMatched) {
    await User.addFriend(viewingUsername, viewedUsername);
    return res.json({ matched: true });
  }

  return res.json({ matched: false });
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

/** GET /:username/messages-between/:friendUsername - get messages between two users
 *
 * => {messages: [{id,
 *                 body,
 *                 sentAt,
 *                 readAt,
 *                 fromUser: {username, firstName, lastName}}, ...]
 *
 **/

router.get('/:username/messages-between/:friendUsername', ensureCorrectUser, async function (req, res, next) {
  const messages = await User.messagesBetween(req.params.username, req.params.friendUsername);
  return res.json({ messages });
});

/** GET /:username/friends - get friends of a user
 *
 * => {friends: [{username,
 *                 firstName,
 *                 lastName,
 *                 imageUrl,} ...]
 *
 **/

router.get('/:username/friends', ensureCorrectUser, async function (req, res, next) {
  const friends = await User.getFriends(req.params.username);
  return res.json({ friends });
});


module.exports = router;