'use strict';

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.REGION;
const s3 = new S3Client({ region: REGION });

const FILE_SIZE_LIMIT = 1024*1024*250;
const notAllowed = ["_", "(", ")", "[", "]", "<", ">", "%", "{", "}", "|", "/", "\\", "^", "~", "`", "$", "#"];
const supportedSet = new Set(["mp3", "wav", "ogg", "mp4"]);

const Response = (code, body, callback) => {
  callback(null, {
    statusCode: code,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  });
}

const Success = (body, callback) => {
  Response(200, body, callback);
}
const Failure = (body, callback) => {
  Response(400, body, callback);
}

const getUrlRequiredParameters = ['name', 'size', 'type'];
const getFileUrlRequiredParameters = ['key'];
const validateParameters = (parameters, required, callback) => {
  for (const param of required) {
    if (!(param in parameters)) {
      console.log(`Invalid request body: ${JSON.stringify(parameters)}`);
      let body = {
        error : "Invalid request body"
      };
      Failure(body, callback);
      return false;
    }
  }
  return true;
}

module.exports.getURL = async (event, context, callback) => {
  let parameters = JSON.parse(event.body);

  // Validate event body
  if (!validateParameters(parameters, getUrlRequiredParameters, callback)) {
    return;
  }

  console.log(`Received request body:\n${event.body}`);

  // Make sure the name is not an issue for url encoding
  let parsed = parameters.name.split(" ").join("");
  for (let i = 0, length = notAllowed.length; i < length; i++) {
    parsed = parsed.split(notAllowed[i]).join("");
  }

  // Check that the file is not too big
  let size = parameters.size;
  if (size > FILE_SIZE_LIMIT) {
    // If the file size is too big, return forbidden
    console.log(`File size exceeds allowed: ${size} > ${FILE_SIZE_LIMIT}`);
    return Failure({error: "size"}, callback);
  }

  // Get the file type
  let fileType = parameters.name.split(".").pop();

  if (!supportedSet.has(fileType)) {
    // If the file type is not supported, return forbidden
    console.log(`File type not supported: ${fileType}`);
    return Failure({error: "denied"}, callback);
  }

  // Get the timestamp
  let timestamp = "" + Date.now();
  let key = timestamp + "_" + parsed;

  console.log(`Getting signed URL for file ${key}`);

  // What bucket to send to
  let s3Parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
    ContentType: parameters.type,
    ACL: 'public-read',
  };

  const putCommand = new PutObjectCommand(s3Parameters);

  let uploadURL = await getSignedUrl(s3, putCommand, { expiresIn: 3600 });
  Success({
    key: key,
    timestamp: timestamp,
    uploadURL: uploadURL
  }, callback);
};

module.exports.getFileURL = async (event, context, callback) => {
  let parameters = JSON.parse(event.body);

  // Validate event body
  if (!validateParameters(parameters, getFileUrlRequiredParameters, callback)) {
    return;
  }

  console.log(`Received request body:\n${event.body}`);

  // Construct the s3 bucket's url to download from
  let key = parameters.key;
  let url = "https://s3.amazonaws.com/"
    + process.env.S3_AUDIO_BUCKET
    + "/" + key;

  // Check if the object exists
  let s3Parameters = {
    Bucket: process.env.S3_AUDIO_BUCKET,
    Key: key,
  };
  const headCommand = new HeadObjectCommand(s3Parameters);

  try {
    const response = await s3.send(headCommand);
  } catch (err) {
    console.log(`Error searching for file: ${key}, ${err.code} ${err.message}`);
    if (err.code === 'NotFound') {
      // The object was not found, return error
      return Failure({error: 'not_found'}, callback);
    }

    return Failure({error: 'unknown'}, callback);
  }

  console.log(`File exists: ${key}`);

  const getCommand = new GetObjectCommand(s3Parameters);
  let downloadurl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });

  Success({
    url: url,
    downloadurl: downloadurl,
  }, callback);
}
