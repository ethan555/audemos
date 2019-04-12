'use strict';

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

module.exports.postprocess = (event) => {
  event.Records.forEach((record) => {
    const filename = record.s3.object.key;
    const filesize = record.s3.object.size;
    console.log(`New .mp3 object has been created: ${filename} (${filesize} bytes)`);
  });
};
