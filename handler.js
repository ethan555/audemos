'use strict';

var AWS = require('aws-sdk');

module.exports.getURL = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);

  // Make sure the name is not an issue for url encoding
  var parsed = parameters.name.split(" ").join("");
  const notAllowed = ["_", "(", ")", "[", "]", "<", ">", "%", "{", "}", "|", "/", "\\", "^", "~", "`", "$", "#"];
  for (var i = 0, length = notAllowed.length; i < length; i++) {
    parsed = parsed.split(notAllowed[i]).join("");
  }

  // Check that the file is not too big
  if (parameters.size > 1024 * 1024 * 250) {
    // If the file type is not supported, return forbidden
    callback(null, {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        key: "size",
        timestamp: "size",
        uploadURL: "size",
      }),
    }
    );
    return;
  }

  // Get the file type
  var fileType = parameters.name.split(".").pop();

  const supportedSet = new Set(["mp3", "wav", "ogg", "mp4"]);
  if (!supportedSet.has(fileType)) {
    // If the file type is not supported, return forbidden
    callback(null, {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        key: "denied",
        timestamp: "denied",
        uploadURL: "denied",
      }),
    }
    );
    return;
  }

  // Get the timestamp
  var timestamp = "" + Date.now();
  var key = timestamp + "_" + parsed;

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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify({
      key: key,
      timestamp: timestamp,
      uploadURL: uploadURL
    }),
  }
  );
};

module.exports.getFileURL = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);

  // Construct the s3 bucket's url to download from
  var key = parameters.key;
  var url = "https://s3.amazonaws.com/"
    + process.env.S3_AUDIO_BUCKET
    + "/" + key;

  var s3Parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
  };

  // Check if the object exists
  s3.headObject(s3Parameters, function (err, metadata) {
    if (err && err.code === 'NotFound') {
      // The object was not found, return error
      callback(null,
        {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({
            url: 'not_found',
            downloadurl: 'not_found',
          }),
        }
      );
    } else {
      // We found the object, so can return a good url
      var downloadurl = s3.getSignedUrl('getObject', s3Parameters);

      callback(null,
        {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({
            url: url,
            downloadurl: downloadurl,
          }),
        }
      );
    }
  });
}
