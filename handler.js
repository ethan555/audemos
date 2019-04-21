'use strict';

var AWS = require('aws-sdk');

module.exports.getURL = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);

  // Get the timestamp
  var timestamp = Date.now();
  var key = "" + timestamp + parameters.name;

  // What bucket to send to
  var s3Parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
    ContentType: parameters.type,
    ACL: 'public-read',
  };

  var uploadURL = s3.getSignedUrl('putObject', s3Parameters);
  callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Credentials' : true,
        'Access-Control-Allow-Methods' : 'POST',
        'Access-Control-Allow-Headers' : 'Content-Type',
      },
      body: JSON.stringify({
        key : key,
        uploadURL : uploadURL
      }),
    }
  );
};
