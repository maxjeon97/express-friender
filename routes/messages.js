"use strict";

const Router = require("express").Router;
const router = new Router();
const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sentAt,
 *               readAt,
 *               fromUser: {username, firstName, lastName},
 *               toUser: {username, firstName, lastName}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async function (req, res, next) {
  const currentUser = res.locals.user;

  const message = await Message.get(req.params.id);


  if (currentUser.username === message.fromUser.username ||
    currentUser.username === message.toUser.username) {
    return res.json({ message });
  }
  else {
    throw new UnauthorizedError("Cannot access messages that are not your own");
  }
});

/** POST / - post message.
 *
 * {toUsername, body} =>
 *   {message: {id, fromUsername, toUsername, body, sent_at}}
 *
 **/

router.post('/', async function (req, res, next) {
  if (req.body?.body === undefined || req.body?.toUsername === undefined) {
    throw new BadRequestError("Must specify recipient and must include body");
  }

  const currentUser = res.locals.user;

  req.body.fromUsername = currentUser.username;

  const message = await Message.create(req.body);

  return res.status(201).json({ message });
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, readAt}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async function (req, res, next) {
  const currentUser = res.locals.user;
  const messageId = req.params.id;

  const messageData = await Message.get(messageId);
  const recipient = messageData.toUser.username;

  if (currentUser.username === recipient) {
    const message = await Message.markRead(messageId);
    return res.json({ message });
  }
  else {
    throw new UnauthorizedError("Cannot mark other users' messages as read");
  }
});



module.exports = router;