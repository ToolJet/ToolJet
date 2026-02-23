import { createReadStream } from 'fs';
import readDir from 'recursive-readdir';
import { resolve as _resolve } from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { lookup } from 'mime-types';
import chalk from 'chalk';
import { existsSync } from 'fs';

const __dirname = _resolve();
const pluginFilter = process.argv[2] || null;

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
  followRegionRedirects: true,
});

const basePluginsPath = _resolve(__dirname, 'plugins');
const directoryPath = pluginFilter ? _resolve(basePluginsPath, pluginFilter) : basePluginsPath;

if (pluginFilter && !existsSync(directoryPath)) {
  console.error(chalk.redBright(`❌ Plugin directory not found: ${directoryPath}`));
  process.exit(1);
}

const getDirectoryFilesRecursive = (dir, ignores = []) => {
  return new Promise((resolve, reject) => {
    readDir(dir, ignores, (err, files) => (err ? reject(err) : resolve(files)));
  });
};

const generateFileKey = (fileName) => {
  const S3objectPath = fileName.split('/marketplace/plugins/')[1];
  return `marketplace-assets/${S3objectPath}`;
};

const uploadToS3 = async () => {
  const start = Date.now();
  const errors = [];
  let successCount = 0;

  console.log(chalk.cyanBright('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyanBright('📤 S3 ASSETS UPLOADER'));
  console.log(chalk.cyanBright('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  try {
    if (pluginFilter) {
      console.log(`[${new Date().toLocaleTimeString()}] ℹ Filtering to plugin: ${chalk.yellow(pluginFilter)}`);
    }
    console.log(`[${new Date().toLocaleTimeString()}] ℹ Scanning directory for files...`);
    const fileArray = await getDirectoryFilesRecursive(directoryPath, [
      'node_modules',
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

    const uploadPromises = fileArray.map(async (file, index) => {
      const S3params = {
        Bucket: process.env.AWS_BUCKET,
        Body: createReadStream(file),
        Key: generateFileKey(file),
        ContentType: lookup(file) || 'application/octet-stream',
        ContentEncoding: 'utf-8',
        CacheControl: 'immutable,max-age=31536000,public',
      };

      const indexStr = `[${(index + 1).toString().padStart(2, '0')}/${fileArray.length}]`;
      try {
        const upload = new Upload({
          client: s3,
          params: S3params,
        });
        const data = await upload.done();
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
      } catch (err) {
        console.log(chalk.redBright(`${indexStr} ❌ Failed to upload: ${file}`));
        console.error(chalk.gray(`↳ ${err.message}`));
        errors.push({ file, message: err.message });
      }
    });

    await Promise.all(uploadPromises);

    const duration = ((Date.now() - start) / 1000).toFixed(1);

    console.log(chalk.cyanBright('\n━━━━━━━━━━━━━━━ UPLOAD SUMMARY ━━━━━━━━━━━━━━━━━'));
    if (errors.length > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Upload completed with ${errors.length} error(s)`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] 🎉 All files uploaded successfully`);
    }
    console.log(
      `[${new Date().toLocaleTimeString()}] ✅ Successfully uploaded: ${successCount}/${fileArray.length} files`
    );
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
