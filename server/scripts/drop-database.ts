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
      `PGPASSWORD=${process.env.PG_PASS || ''} dropdb ` +
      `-h ${process.env.PG_HOST || ''} ` +
      `-p ${process.env.PG_PORT || 5432} ` +
      `-U ${process.env.PG_USER || ''} ` +
      process.env.PG_DB;

    exec(dropdb, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Dropped database ${process.env.PG_DB}`);
    });
  });
};

const nodeEnvPath = path.resolve(
  process.cwd(),
  process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env',
);

const fallbackPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(nodeEnvPath)) {
  createDatabase(nodeEnvPath);
} else if (fs.existsSync(fallbackPath)) {
  createDatabase(fallbackPath);
} else {
  console.error(`${nodeEnvPath} file not found to drop database`);
}
