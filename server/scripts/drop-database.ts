import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { exec } from 'child_process';

const createDatabase = (envPath: string): void => {
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw result.error;
  }

  exec('command -v dropdb', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }

    const dropdb =
      `PGPASSWORD=${process.env.TYPEORM_PASSWORD} dropdb ` +
      `-h ${process.env.TYPEORM_HOST} ` +
      `-p ${process.env.TYPEORM_PORT} ` +
      `-U ${process.env.TYPEORM_USERNAME} ` +
      process.env.TYPEORM_DATABASE;

    exec(dropdb, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Dropped database ${process.env.TYPEORM_DATABASE}`);
    });
  });
};

const nodeEnvPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);
const fallbackPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(nodeEnvPath)) {
  createDatabase(nodeEnvPath);
} else if (fs.existsSync(fallbackPath)) {
  createDatabase(fallbackPath);
} else {
  console.error(`.env.${process.env.NODE_ENV} file not found to drop database`);
}
