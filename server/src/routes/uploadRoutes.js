const express = require('express');
const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProductImage } = require('../middleware/uploadMiddleware');
const { s3Client, missingConfig, getPublicUrl } = require('../config/s3');

const router = express.Router();

router.post('/product-image', protect, adminOnly, uploadProductImage.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    if (!s3Client) {
      return res.status(500).json({
        message: `S3 is not configured. Missing env vars: ${missingConfig.join(', ')}`,
      });
    }

    const extension = path.extname(req.file.originalname) || '.jpg';
    const key = `products/product-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

    return res.status(201).json({ imageUrl: getPublicUrl(key) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
