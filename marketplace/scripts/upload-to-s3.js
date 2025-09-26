import { createReadStream } from 'fs';
import readDir from 'recursive-readdir';
import { resolve as _resolve } from 'path';
import aws from 'aws-sdk';
import { lookup } from 'mime-types';
import chalk from 'chalk';

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
  const start = Date.now();
  const errors = [];
  let successCount = 0;

  console.log(chalk.cyanBright('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyanBright('📤 S3 ASSETS UPLOADER'));
  console.log(chalk.cyanBright('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  try {
    console.log(`[${new Date().toLocaleTimeString()}] ℹ Scanning directory for files...`);
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

    console.log(`[${new Date().toLocaleTimeString()}] ℹ Found ${fileArray.length} files to upload`);
    console.log(`[${new Date().toLocaleTimeString()}] ℹ Target bucket: ${process.env.AWS_BUCKET}\n`);

    const uploadPromises = fileArray.map((file, index) => {
      return new Promise((resolve) => {
        const S3params = {
          Bucket: process.env.AWS_BUCKET,
          Body: createReadStream(file),
          Key: generateFileKey(file),
          ContentType: lookup(file) || 'application/octet-stream',
          ContentEncoding: 'utf-8',
          CacheControl: 'immutable,max-age=31536000,public',
        };

        s3.upload(S3params, function (err, data) {
          const indexStr = `[${(index + 1).toString().padStart(2, '0')}/${fileArray.length}]`;
          if (err) {
            console.log(chalk.redBright(`${indexStr} ❌ Failed to upload: ${file}`));
            console.error(chalk.gray(`↳ ${err.message}`));
            errors.push({ file, message: err.message });
          } else {
            console.log(chalk.greenBright(`${indexStr} ✅ Uploaded: ${file}`));
            console.log(
              chalk.gray(
                JSON.stringify(
                  {
                    ETag: data.ETag,
                    Location: data.Location,
                    Key: data.Key,
                    Bucket: data.Bucket,
                  },
                  null,
                  2
                )
              )
            );
            successCount++;
          }
          resolve();
        });
      });
    });

    await Promise.all(uploadPromises);

    const duration = ((Date.now() - start) / 1000).toFixed(1);

    console.log(chalk.cyanBright('\n━━━━━━━━━━━━━━━ UPLOAD SUMMARY ━━━━━━━━━━━━━━━━━'));
    if (errors.length > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Upload completed with ${errors.length} error(s)`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] 🎉 All files uploaded successfully`);
    }
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Successfully uploaded: ${successCount}/${fileArray.length} files`);
    console.log(`[${new Date().toLocaleTimeString()}] ❌ Failed uploads: ${errors.length}/${fileArray.length} files`);
    console.log(`[${new Date().toLocaleTimeString()}] ℹ Total time: ${duration}s`);

    if (errors.length > 0) {
      console.log(chalk.cyanBright('\n━━━━━━━━━━━━━━━ ERROR DETAILS ━━━━━━━━━━━━━━━━━'));
      errors.forEach((err, idx) => {
        console.log(chalk.red(`Error #${idx + 1}: ${err.file}`));
        console.log(chalk.gray(`  ↳ ${err.message}`));
      });
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(chalk.bgRed.white('❌ Script failed with error:'));
    console.error(error);
    process.exit(1);
  }
};

uploadToS3();