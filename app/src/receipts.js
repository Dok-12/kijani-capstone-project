
'use strict';

const { randomUUID } = require('node:crypto');
const {
  S3Client,
  PutObjectCommand
} = require('@aws-sdk/client-s3');

const isStaging = process.env.ENV === 'staging';
const bucket = process.env.RECEIPTS_BUCKET;
const region = process.env.AWS_REGION || 'eu-north-1';

const s3 = isStaging
  ? new S3Client({ region })
  : null;

async function uploadReceipt(payment, total) {
  if (!isStaging) {
    return null;
  }

  if (!bucket) {
    throw new Error('Receipt bucket is not configured');
  }

  const receiptId = randomUUID();

  const receipt = {
    receiptId,
    paymentId: payment.paymentId || randomUUID(),
    amount: payment.amount,
    fee: payment.fee || 0,
    total,
    currency: payment.currency || 'KES',
    status: 'REQUEST_ACCEPTED',
    environment: 'staging',
    createdAt: new Date().toISOString()
  };

  const key = `incoming/${receiptId}.json`;

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(receipt),
    ContentType: 'application/json'
  }));

  console.log('Receipt uploaded:', {
    receiptId,
    bucket,
    key
  });

  return receipt;
}

module.exports = { uploadReceipt };
