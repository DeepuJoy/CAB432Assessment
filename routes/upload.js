var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'public/uploads/' }); // This sets the destination folder for uploaded files
const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK with your AWS credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: 'ap-southeast-2', // Set your desired region
});

const s3 = new AWS.S3();
const bucketName = "n10753753-s3-project";

// create bucket if it doesn't already exist
async function createS3Bucket(bucketName) {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    console.log(`Created bucket: ${bucketName}`);
  } catch (err) {
    if (err.code === 'BucketAlreadyOwnedByYou' || err.code === 'BucketAlreadyExists') {
      console.log(`Bucket already exists: ${bucketName}`);
    } else {
      console.error('Error creating bucket:', err);
      throw err; // Re-throw the error for the calling function to handle
    }
  }
}

function generateUniqueObjectKey(file) {
  const timestamp = Date.now();
  const uniqueIdentifier = Math.random().toString(36).substring(7); // Random unique identifier
  const originalName = file.originalname;
  const objectKey = `${timestamp}-${uniqueIdentifier}-${originalName}`;
  return objectKey;
}


async function uploadFileToS3(bucketName, file) {
    const uniqueFileName = generateUniqueObjectKey(file);
    const params = {
      Bucket: bucketName,
      Key: uniqueFileName, // Set the object key (file name) in S3
      Body: require('fs').createReadStream(file.path), // Read the file stream
    };
  
    try {
      const result = await s3.upload(params).promise();
      console.log(`File uploaded to S3: ${file.originalname}`);
  
      return result.Key; // Return the S3 key
    } catch (err) {
      console.error('Error uploading file to S3:', err);
      throw err; // Re-throw the error for the calling function to handle
    }
}


async function uploadMultipleFilesToS3(bucketName, files) {
    try {
      const s3Keys = await Promise.all(files.map(async (file) => {
        return await uploadFileToS3(bucketName, file);
      }));
  
      return s3Keys; // Return an array of S3 keys for all files
    } catch (err) {
      console.error('Error uploading files to S3:', err);
      throw err; // Re-throw the error for the calling function to handle
    }
}
  

async function listObjectsInBucket() {
  const params = {
    Bucket: bucketName,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const objects = data.Contents;

    if (objects.length === 0) {
      console.log('No objects found in the bucket.');
    } else {
      console.log('Objects in the bucket:');
      objects.forEach(object => {
        console.log(object.Key);
      });
    }
  } catch (err) {
    console.error('Error listing objects in the bucket:', err);
    throw err; // Re-throw the error for the calling function to handle
  }
}

router.post('/upload', upload.array('files', 5), async function(req, res) {
  try {
    // Access the uploaded files via req.files
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files uploaded.');
    }

    await createS3Bucket(bucketName);
    const s3Keys = await uploadMultipleFilesToS3(bucketName, req.files);
    await 
    console.log(s3Keys)
    res.render('upload', { s3Keys });

  } catch (error) {
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

module.exports = router;
