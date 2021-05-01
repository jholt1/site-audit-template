const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

const s3_bucket = process.env.BUCKET_NAME;
const date = new Date();
const d = date.toISOString().split('T')[0];
const bucket = new AWS.S3();

const run = async () => {
  let obj = {};
  let scores = [];

  try {
    const scoresFile = await bucket
      .getObject({ Bucket: s3_bucket, Key: 'summary.json' })
      .promise();
    const file = await bucket
      .getObject({ Bucket: s3_bucket, Key: 'history.json' })
      .promise();

    obj = JSON.parse(file.Body);
    scores = JSON.parse(scoresFile.Body);
  } catch (err) {
    logger(err);
  }

  scores.forEach((page) => {
    if (!obj[page.url]) {
      obj[page.url] = {};
    }

    if (!obj[page.url][d]) {
      obj[page.url][d] = { url: page.url, ...page.detail }
    }

    if (Object.keys(obj[page.url]).length > 30) {
      delete obj[page.url][Object.keys(obj[page.url])[0]]
    }
  });

  bucket.upload({
    Key: `history.json`,
    Body: JSON.stringify(obj),
    Bucket: s3_bucket,
    ContentType: 'application/json',
    ACL: 'public-read'
  }, (error, file) => {
    if (error) {
      console.log(error);
    }
    console.log('completed')
  });
};

run();