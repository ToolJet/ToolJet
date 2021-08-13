import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { exec } from 'child_process';
import { buildAndValidateDatabaseConfig } from './database-config-utils';

function dropDatabaseFromFile(envPath: string): void {
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw result.error;
  }

  dropDatabase();
}

function dropDatabase(): void {
  const { value: envVars, error } = buildAndValidateDatabaseConfig();

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  exec('command -v dropdb', (err, _stdout, _stderr) => {
    if (err) {
      console.error(err);
      return;
    }

    const dropdb =
      `PGPASSWORD=${envVars.PG_PASS} dropdb ` +
      `-h ${envVars.PG_HOST} ` +
      `-p ${envVars.PG_PORT} ` +
      `-U ${envVars.PG_USER} ` +
      process.env.PG_DB;

    exec(dropdb, (err, _stdout, _stderr) => {
      if (!err) {
        console.log(`Dropped database ${envVars.PG_DB}`);
        return;
      }

      const errorMessage = `database "${envVars.PG_DB}" does not exist`;

      if (err.message.includes(errorMessage)) {
        console.log(errorMessage);
      } else {
        console.error(err);
      }
    });
  });
}

const nodeEnvPath = path.resolve(
  process.cwd(),
  process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env',
);

const fallbackPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(nodeEnvPath)) {
  dropDatabaseFromFile(nodeEnvPath);
} else if (fs.existsSync(fallbackPath)) {
  dropDatabaseFromFile(fallbackPath);
} else {
  console.log(
    `${nodeEnvPath} file not found to drop database\n` +
      'Picking up config from the environment',
  );
  dropDatabase();
}
