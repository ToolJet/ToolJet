import { createReadStream } from 'fs';
import readDir from 'recursive-readdir';
import { resolve as _resolve } from 'path';
import aws from 'aws-sdk';
import { lookup } from 'mime-types';

const { config, S3 } = aws;
const __dirname = _resolve();

config.update({
  region: process.env.AWS_REGION || 'us-west-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  maxRetries: 3,
});

const directoryPath = _resolve(__dirname, 'plugins');

const getDirectoryFilesRecursive = (dir, ignores = []) => {
  return new Promise((resolve, reject) => {
    readDir(dir, ignores, (err, files) => (err ? reject(err) : resolve(files)));
  });
};

const generateFileKey = (fileName) => {
  const S3objectPath = fileName.split('/marketplace/plugins/')[1];
  return `marketplace-assets/${S3objectPath}`;
};

const s3 = new S3();

const uploadToS3 = async () => {
  try {
    const fileArray = await getDirectoryFilesRecursive(directoryPath, [
      'common',
      '.DS_Store',
      '.gitignore',
      'index.d.ts',
      'index.d.ts.map',
      'README.md',
      'package-lock.json',
      'package.json',
      'tsconfig.json',
    ]);

    fileArray.map((file) => {
      // Configuring parameters for S3 Object
      const S3params = {
        Bucket: process.env.AWS_BUCKET,
        Body: createReadStream(file),
        Key: generateFileKey(file),
        ContentType: lookup(file),
        ContentEncoding: 'utf-8',
        CacheControl: 'immutable,max-age=31536000,public',
      };
      s3.upload(S3params, function (err, data) {
        if (err) {
          // Set the exit code while letting
          // the process exit gracefully.
          console.error(err);
          process.exitCode = 1;
        } else {
          console.log(`Assets uploaded to S3: `, data);
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
};

uploadToS3();
