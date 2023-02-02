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

  const connectivityCheck = exec('command -v createdb');
  connectivityCheck.on('exit', function (signal) {
    if (signal === 1) {
      console.error('Unable to connect to database');
      process.exit(1);
    }
  });

  // Allow dropping db based on cmd line arg
  const dbNameFromArg = process.argv[2];
  if (dbNameFromArg) return dropDb(envVars, dbNameFromArg);

  dropDb(envVars, envVars.PG_DB);
}

function dropDb(envVars, dbName) {
  const dropdb =
    `PGPASSWORD=${envVars.PG_PASS} dropdb ` +
    `-h ${envVars.PG_HOST} ` +
    `-p ${envVars.PG_PORT} ` +
    `-U ${envVars.PG_USER} ` +
    dbName;

  exec(dropdb, (err, _stdout, _stderr) => {
    if (!err) {
      console.log(`Dropped database ${dbName}`);
      return;
    }

    const errorMessage = `database "${dbName}" does not exist`;

    if (err.message.includes(errorMessage)) {
      console.log(errorMessage);
    } else {
      console.error(_stderr);
      process.exit(1);
    }
  });
}

const nodeEnvPath = path.resolve(process.cwd(), process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env');

const fallbackPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(nodeEnvPath)) {
  dropDatabaseFromFile(nodeEnvPath);
} else if (fs.existsSync(fallbackPath)) {
  dropDatabaseFromFile(fallbackPath);
} else {
  console.log(`${nodeEnvPath} file not found to drop database\n` + 'Picking up config from the environment');
  dropDatabase();
}
