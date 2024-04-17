"use strict";

const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const router = express.Router();
const { ensureLoggedIn } = require('../middleware/auth');
const User = require('../models/user');

const s3Client = new S3Client({
  region: 'us-west-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), ensureLoggedIn, async function (req, res, next) {
  const { username } = res.locals.user;
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${Date.now()}_${req.file.originalname}`,
    Body: req.file.buffer,
    ACL: 'public-read'
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const imageUrl =
      `https://${process.env.BUCKET_NAME}.s3.us-west-1.amazonaws.com/${params.Key}`;
    await User.updatePhoto(username, imageUrl);

    return res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    throw new Error(
      "Failed to send image.", 503
    );
  }
});

module.exports = router;