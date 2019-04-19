'use strict';

var AWS = require('aws-sdk');

module.exports.getURL = (event, context, callback) => {
  var s3 = new AWS.s3();
  var parameters = JSON.parse(event.body);

  // Generate randomized string for the object key
  // var random_string = "";
  // var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // for (var i = 0; i < 32; i ++) {
  //   random_string += chars.charAt(Math.floor(Math.random() * chars.length));
  // }

  // What bucket to send to
  var s3Parameterss = {
    Bucket: '${S3_AUDIO_BUCKET}',
    Key: parameters.name,
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
      body: JSON.stringify({ uploadURL : uploadURL }),
    }
  );
};

// module.exports.hello = async (event, context) => {
//   return {
//     statusCode: 200,
//     body: JSON.stringify({
//       message: 'Go Serverless v1.0! Your function executed successfully!',
//       input: event,
//     }),
//   };

//   // Use this code if you don't use the http event with the LAMBDA-PROXY integration
//   // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
// };

// module.exports.postprocess = (event) => {
//   event.Records.forEach((record) => {
//     const filename = record.s3.object.key;
//     const filesize = record.s3.object.size;
//     console.log(`New .mp3 object has been created: ${filename} (${filesize} bytes)`);
//   });
// };
