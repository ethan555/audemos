'use strict';

var AWS = require('aws-sdk');

module.exports.getURL = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);

  // Get the timestamp
  var timestamp = "" + Date.now();
  var key = timestamp + "_" + parameters.name;

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
        timestamp : timestamp,
        uploadURL : uploadURL
      }),
    }
  );
};

module.exports.getFileURL = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);

  // Construct the s3 bucket's url to download from
  var url = "https://s3.amazonaws.com/" + process.env.S3_AUDIO_BUCKET;
  var key = "";

  // We only want files from this bucket with the prefix we want
  var s3Parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Prefix: parameters.prefix + "_",
  };
  console.log(s3Parameters.Prefix);

  // Get the list of objects using our filters
  s3.listObjectsV2(s3Parameters, function(err, data) {
    if (err) console.log(err, err.stack); // error ocurred
    else {
      if (data.Contents.length > 0) {
        //url += data.Contents[0].Key;  // append to the prefix to get the link
        key = data.Contents[0].key;
      }
    }
  });
  console.log(key);

  // url = s3.getObject
  url = s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
  })

  console.log(url);

  callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Credentials' : true,
        'Access-Control-Allow-Methods' : 'POST',
        'Access-Control-Allow-Headers' : 'Content-Type',
      },
      body: JSON.stringify({
        url : url,
      }),
    }
  );
}

// module.exports.downloadFile = (event, context, callback) => {
//   var s3 = new AWS.S3();
//   var parameters = JSON.parse(event.body);

//   var s3parameters = {
//     Bucket: process.env.S3_AUDIO_BUCKET,
//     Prefix: parameters.prefix,
//   };
// }
