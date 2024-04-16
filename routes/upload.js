"use strict";

const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const router = express.Router();

const s3Client = new S3Client({
  region: 'us-west-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), async function (req, res, next) {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${Date.now()}_${req.file.originalname}`,
    Body: req.file.buffer,
    ACL: 'public-read'
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return res.json({
      imageUrl: `https://${process.env.BUCKET_NAME}.s3.us-west-1.amazonaws.com/${params.Key}`
    });
  } catch (err) {
    throw new Error(
      "Failed to send image to server. Service is unavailable.", 503
    );
  }
});

module.exports = router;