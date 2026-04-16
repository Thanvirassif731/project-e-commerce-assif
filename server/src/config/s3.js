const { S3Client } = require('@aws-sdk/client-s3');

const requiredConfig = [
  'AWS_S3_REGION',
  'AWS_S3_BUCKET_NAME',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
];

const missingConfig = requiredConfig.filter((key) => !process.env[key]);

const s3Client =
  missingConfig.length === 0
    ? new S3Client({
        region: process.env.AWS_S3_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

const getPublicUrl = (key) => {
  const customBase = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();
  if (customBase) {
    return `${customBase.replace(/\/$/, '')}/${key}`;
  }

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
};

module.exports = {
  s3Client,
  missingConfig,
  getPublicUrl,
};
