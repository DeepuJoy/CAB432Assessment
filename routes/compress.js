var express = require('express');
var router = express.Router();
const AWS = require('aws-sdk');
const { exec } = require('child_process');
const { Readable } = require('stream');
require('dotenv').config();

const bzip2Path = '/usr/bin/bzip2'

// Configure AWS SDK with your AWS credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'ap-southeast-2',
});

const s3 = new AWS.S3();
const bucketName = "n10753753-s3-project";

// Function to retrieve an object from S3
async function getObjectFromS3(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const data = await s3.getObject(params).promise();
    return data.Body;
  } catch (err) {
    console.error('Error retrieving object from S3:', err);
    throw err;
  }
}

function extractURL(bucketName, key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const url = s3.getSignedUrl('getObject', params);
  return url;
}

// Function to upload a file to S3
async function uploadFileToS3(res, firstS3Key, compressedData) {
  const compressedFileName = firstS3Key + '.bz2';
  const params = {
    Bucket: bucketName,
    Key: compressedFileName,
    Body: compressedData,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('S3 upload error:', err);
      res.status(500).send('S3 Upload Error');
      return;
    }

    const compressedFileUrl = extractURL(bucketName, compressedFileName);

    console.log('File uploaded to S3:', data.Location);
    console.log('Compressed file URL:', compressedFileUrl);
    res.send('Object retrieved, compressed, and uploaded to S3 successfully.');
  });
}

// Function to compress and upload data to S3
async function compressAndUploadToS3(res, firstS3Key, objectData) {
  const objectStream = Readable.from([objectData]);

  const compressedStream = exec(`${bzip2Path}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Compression error:', error);
      res.status(500).send('Compression Error');
      return;
    }
    console.log('File compressed successfully');
    uploadFileToS3(res, firstS3Key, stdout);
  });

  objectStream.pipe(compressedStream.stdin);

  compressedStream.stdin.on('error', (error) => {
    console.error('Write error:', error);
    res.status(500).send('Write Error');
  });
}

router.post('/compress', async function (req, res) {
  const s3Keys = req.body.s3Keys;

  if (!s3Keys) {
    return res.status(400).send('Invalid or missing S3 keys.');
  }

  const s3KeysArray = s3Keys.split(',');
  const firstS3Key = s3KeysArray[0];

  try {
    const objectData = await getObjectFromS3(firstS3Key);
    await compressAndUploadToS3(res, firstS3Key, objectData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

module.exports = router;



















// var express = require('express');
// var router = express.Router();
// const AWS = require('aws-sdk');
// const { exec } = require('child_process');
// const { Readable } = require('stream');
// require('dotenv').config();

// const bzip2Path = '/usr/bin/bzip2'


// // Configure AWS SDK with your AWS credentials
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   sessionToken: process.env.AWS_SESSION_TOKEN,
//   region: 'ap-southeast-2', // Set your desired region
// });

// const s3 = new AWS.S3();
// const bucketName = "n10753753-s3-project";


// // get the object from S3 
// async function getObjectFromS3(key) {
//     const params = {
//       Bucket: bucketName,
//       Key: key, // The S3 key of the object you want to retrieve
//     };
  
//     try {
//       const data = await s3.getObject(params).promise();
//       return data.Body; // Return the object's data
//     } catch (err) {
//       console.error('Error retrieving object from S3:', err);
//       throw err; // Re-throw the error for the calling function to handle
//     }
//   }



// // router.post('/compress', async function(req, res) {
// //     // Assuming that the S3 keys are sent as an array in the request body
// //     const s3Keys = req.body.s3Keys;

// //     if (!s3Keys) {
// //       return res.status(400).send('Invalid or missing S3 keys.');
// //     }
  
// //     const s3KeysArray = s3Keys.split(',');
// //     s3KeysArray.forEach(key => {
// //         console.log(key);
// //     });

// //     const firstS3Key = s3KeysArray[0];
  
// //     try {
// //       const objectData = await getObjectFromS3(firstS3Key);





// //       // Now you have the object data, you can process it or return it as needed
// //       res.send('Object retrieved and compressed successfully.');
// //     } catch (error) {
// //       console.error('Error:', error);
// //       res.status(500).send('Internal Server Error: ' + error.message);
// //     }

// // //   });



// router.post('/compress', async function (req, res) {
//   // Assuming that the S3 keys are sent as an array in the request body
//   const s3Keys = req.body.s3Keys;

//   if (!s3Keys) {
//     return res.status(400).send('Invalid or missing S3 keys.');
//   }

//   const s3KeysArray = s3Keys.split(',');
//   const firstS3Key = s3KeysArray[0];

//   try {
//     const objectData = await getObjectFromS3(firstS3Key);

//     // Create a Readable stream from objectData
//     const objectStream = Readable.from([objectData]);

//     // Create a Writable stream for bzip2's output
//     const compressedStream = exec(`${bzip2Path}`, (error, stdout, stderr) => {
//       if (error) {
//         console.error('Compression error:', error);
//         res.status(500).send('Compression Error');
//         return;
//       }

//       // Now, you can process or store the compressed data as needed
//       console.log('File compressed successfully');




//       // Set up the S3 client
//       const s3 = new AWS.S3();

//       // Specify the S3 bucket and key for the compressed file
//       const compressedFileName = firstS3Key + '.bz2'; // You can modify the key as needed
//       const params = {
//         Bucket: bucketName, // Your S3 bucket name
//         Key: compressedFileName,
//         Body: stdout, // Compressed data stream
//       };

//       // Upload the compressed data to S3
//       s3.upload(params, (err, data) => {
//         if (err) {
//           console.error('S3 upload error:', err);
//           res.status(500).send('S3 Upload Error');
//           return;
//         }

//       console.log('File uploaded to S3:', data.Location);

//         // You can choose to return the S3 location or perform other operations here
//         res.send('Object retrieved, compressed, and uploaded to S3 successfully.');
//       });
//     });

//     objectStream.pipe(compressedStream.stdin);

//     // Handle 'error' events on the compressedStream.stdin
//     compressedStream.stdin.on('error', (error) => {
//       console.error('Write error:', error);
//       res.status(500).send('Write Error');
//     });



//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).send('Internal Server Error: ' + error.message);
//   }
// });


//   module.exports = router;

























// var express = require('express');
// var router = express.Router();
// const AWS = require('aws-sdk');
// const { exec } = require('child_process');
// const { Readable } = require('stream');
// require('dotenv').config();

// // Set up your AWS S3 client
// const s3 = new AWS.S3();
// const bucketName = 'n10753753-s3-project'
// // Path to the bzip2 executable
// const bzip2Path = '/path/to/bzip2';


// // Function to get an object from S3
// async function getObjectFromS3(s3Key) {
//   const params = {
//     Bucket: bucketName,
//     Key: s3Key,
//   };

//   const response = await s3.getObject(params).promise();
//   return response.Body;
// }


// // Function to compress a file and return the compressed data stream
// async function compressFile(s3Key) {
//   try {
//     const objectData = await getObjectFromS3(s3Key);

//     // Create a Readable stream from objectData
//     const objectStream = Readable.from([objectData]);

//     // Create a Writable stream for bzip2's output
//     const compressedStream = exec(`${bzip2Path}`);

//     objectStream.pipe(compressedStream.stdin);

//     return compressedStream.stdout;
//   } catch (error) {
//     console.error('Error:', error);
//     throw error;
//   }
// }

// // Function to upload a stream to S3 and return the pre-signed URL
// async function uploadToS3AndGetURL(s3Key, compressedStream) {
//   const compressedFileName = s3Key + '.bz2';

//   const params = {
//     Bucket: bucketName,
//     Key: compressedFileName,
//     Body: compressedStream,
//   };

//   try {
//     const data = await s3.upload(params).promise();
//     console.log('File uploaded to S3:', data.Location);

//     const urlParams = { Bucket: bucketName, Key: compressedFileName };
//     const url = s3.getSignedUrl('getObject', urlParams);

//     return url;
//   } catch (error) {
//     console.error('S3 upload error:', error);
//     throw error;
//   }
// }

// // Express route handler
// router.post('/compress', async function (req, res) {
//   const s3Keys = req.body.s3Keys;

//   if (!s3Keys) {
//     return res.status(400).send('Invalid or missing S3 keys.');
//   }

//   const s3KeysArray = s3Keys.split(',');
//   const firstS3Key = s3KeysArray[0];

//   try {
//     const compressedStream = await compressFile(firstS3Key);
//     const downloadLink = await uploadToS3AndGetURL(firstS3Key, compressedStream);
//     console.log("THIS IS THE DOWNLOAD LINK");
//     console.log(downloadLink)

//     res.send({
//       message: 'Object retrieved, compressed, and uploaded to S3 successfully.',
//       downloadLink: downloadLink,
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).send('Internal Server Error: ' + error.message);
//   }
// });


// module.exports = router;








