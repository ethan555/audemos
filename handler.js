'use strict';

var AWS = require('aws-sdk');

module.exports.getURL = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);

  var parsed = parameters.name.split(" ").join("");
  var fileType = parameters.name.split(".").pop();

  const supportedSet = new Set(["mp3", "wav", "ogg", "mp4"]);
  if (!supportedSet.has(fileType)) {
    // If the file type is not supported, return forbidden
    callback(null, {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Credentials' : true,
          'Access-Control-Allow-Methods' : 'POST',
          'Access-Control-Allow-Headers' : 'Content-Type',
        },
        body: JSON.stringify({
          key : "denied",
          timestamp : "denied",
          uploadURL : "denied",
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

module.exports.setDownloadTag = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = parseInt(JSON.parse(event.body));
  var key = parameters.key;

  // Set download tag of object
  var s3Parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
    Tagging: {
      TagSet: [
        {
          Key: "downloads", 
          Value: "" + parameters.downloads,
        },
      ]
    }
  };
   
  s3.putObjectTagging(s3Parameters, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(null, {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : 'POST',
            'Access-Control-Allow-Headers' : 'Content-Type',
          },
          body: JSON.stringify({
            response : "failed",
          }),
        }
      );
    } // an error occurred
    else {
      console.log(data);
      callback(null, {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : 'POST',
            'Access-Control-Allow-Headers' : 'Content-Type',
          },
          body: JSON.stringify({
            response : "success",
          }),
        }
      );
    } // successful response
    /*
    data = {
    VersionId: "null"
    }
    */
  });
}

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
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : 'POST',
            'Access-Control-Allow-Headers' : 'Content-Type',
          },
          body: JSON.stringify({
            url : 'not_found',
            downloadurl : 'not_found',
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
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : 'POST',
            'Access-Control-Allow-Headers' : 'Content-Type',
          },
          body: JSON.stringify({
            url : url,
            downloadurl : downloadurl,
          }),
        }
      );
    }
  });
}

module.exports.getDownloadTag = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);
  var key = parameters.key;

  // Set download tag of object
  var s3parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
  };

  s3.getObjectTagging(s3parameters, function(err, data) {
    if (err) {
      callback(null, {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : 'POST',
            'Access-Control-Allow-Headers' : 'Content-Type',
          },
          body: JSON.stringify({
            download : "failed",
          }),
        }
      );
      console.log(err, err.stack);
    } // an error occurred
    else {
      console.log(data);
      var download = data["TagSet"][0].Value;
      callback(null, {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : 'POST',
            'Access-Control-Allow-Headers' : 'Content-Type',
          },
          body: JSON.stringify({
            download : download,
          }),
        }
      );
      
    } // successful response
    /*
    data = {
    TagSet: [
        {
      Key: "Key1", 
      Value: "Value1"
      }
    ],
    }
    */
   });
}

module.exports.downloadTag = (event, context, callback) => {
  var s3 = new AWS.S3();
  var parameters = JSON.parse(event.body);
  var key = parameters.key;

  // Set download tag of object
  var s3parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
  };

  s3.getObjectTagging(s3parameters, function(err, data) {
    if (err) {
      callback(null, {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Access-Control-Allow-Methods' : 'POST',
            'Access-Control-Allow-Headers' : 'Content-Type',
          },
          body: JSON.stringify({
            response : "failed",
          }),
        }
      );
      console.log(err, err.stack);
    } // an error occurred
    else {
      console.log(data);

      // With the data, if the object has been downloaded enough, don't allow further downloads
      var downloads = parseInt(data["TagSet"][0].Value);
      if (downloads == 0) {
        callback(null, {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin' : '*',
              'Access-Control-Allow-Credentials' : true,
              'Access-Control-Allow-Methods' : 'POST',
              'Access-Control-Allow-Headers' : 'Content-Type',
            },
            body: JSON.stringify({
              response : "denied",
            }),
          }
        );
      } else {
        // Decrement the download count
        var newDownloads = "" + (downloads - 1);
        var updateParameters = {
          Bucket: process.env.S3_AUDIO_BUCKET,
          Key: key,
          Tagging: {
            TagSet: [
              {
                Key: "downloads", 
                Value: newDownloads,
              },
            ]
          }
        };

        s3.putObjectTagging(updateParameters, function(err, data) {
          if (err) {
            // Could not update tags
            console.log(err, err.stack);
            callback(null, {
                statusCode: 400,
                headers: {
                  'Access-Control-Allow-Origin' : '*',
                  'Access-Control-Allow-Credentials' : true,
                  'Access-Control-Allow-Methods' : 'POST',
                  'Access-Control-Allow-Headers' : 'Content-Type',
                },
                body: JSON.stringify({
                  response : "failed",
                }),
              }
            );
          } else {
            // Updated tags
            console.log(data);
            callback(null, {
                statusCode: 200,
                headers: {
                  'Access-Control-Allow-Origin' : '*',
                  'Access-Control-Allow-Credentials' : true,
                  'Access-Control-Allow-Methods' : 'POST',
                  'Access-Control-Allow-Headers' : 'Content-Type',
                },
                body: JSON.stringify({
                  response : newDownloads,
                }),
              }
            );
          } // successful response
          /*
          data = {
          VersionId: "null"
          }
          */
        });
      }
      
    } // successful response
    /*
    data = {
    TagSet: [
        {
      Key: "Key1", 
      Value: "Value1"
      }
    ],
    }
    */
   });
}
