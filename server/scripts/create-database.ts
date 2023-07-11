import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { exec } from 'child_process';
import { buildAndValidateDatabaseConfig } from './database-config-utils';
import { isEmpty } from 'lodash';

function createDatabaseFromFile(envPath: string): void {
  const result = dotenv.config({ path: envPath });

  if (process.env.PG_DB_OWNER === 'false') {
    console.log('Skipping database creation');
    return;
  }

  if (result.error) {
    throw result.error;
  }

  createDatabase();
}

function createDatabase(): void {
  const { value: envVars, error } = buildAndValidateDatabaseConfig();

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  if (envVars.PG_DB_OWNER === 'false') {
    console.log('Skipping database creation');
    return;
  }

  const connectivityCheck = exec('command -v createdb');

  connectivityCheck.on('exit', function (signal) {
    if (signal === 1) {
      console.error('Unable to connect to database');
      process.exit(1);
    }
  });

  // Allow creating db based on cmd line arg
  const dbNameFromArg = process.argv[2];
  if (dbNameFromArg) return createDb(envVars, dbNameFromArg);

  createDb(envVars, envVars.PG_DB);
  if (process.env.ENABLE_TOOLJET_DB == 'true') {
    createTooljetDb(envVars, envVars.TOOLJET_DB);
  }
}

function createDb(envVars, dbName) {
  if (isEmpty(dbName)) throw 'Database name cannot be empty';

  const createdb =
    `PGPASSWORD="${envVars.PG_PASS}" createdb ` +
    `-h ${envVars.PG_HOST} ` +
    `-p ${envVars.PG_PORT} ` +
    `-U ${envVars.PG_USER} ` +
    dbName;

  exec(createdb, (err, _stdout, _stderr) => {
    if (!err) {
      console.log(`Created database ${dbName}\n`);
      return;
    }

    const errorMessage = `database "${dbName}" already exists\n`;

    if (err.message.includes(errorMessage)) {
      console.log(`Using Application database\nPG_DB: ${dbName}\nPG_HOST: ${envVars.PG_HOST}\n`);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}

function createTooljetDb(envVars, dbName) {
  if (isEmpty(dbName)) throw 'Database name cannot be empty';

  const createdb =
    `PGPASSWORD="${envVars.TOOLJET_DB_PASS}" createdb ` +
    `-h ${envVars.TOOLJET_DB_HOST} ` +
    `-p ${envVars.TOOLJET_DB_PORT} ` +
    `-U ${envVars.TOOLJET_DB_USER} ` +
    dbName;

  exec(createdb, (err, _stdout, _stderr) => {
    if (!err) {
      console.log(`Created database ${dbName}\n`);
      return;
    }

    const errorMessage = `database "${dbName}" already exists\n`;

    if (err.message.includes(errorMessage)) {
      console.log(`Using Tooljet database\nTOOLJET_DB: ${dbName}\nTOOLJET_DB_HOST: ${envVars.TOOLJET_DB_HOST}\n`);
    } else {
      console.error(_stderr);
      process.exit(1);
    }
  });
}

const nodeEnvPath = path.resolve(process.cwd(), process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env');

const fallbackPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(nodeEnvPath)) {
  createDatabaseFromFile(nodeEnvPath);
} else if (fs.existsSync(fallbackPath)) {
  createDatabaseFromFile(fallbackPath);
} else {
  console.log('Picking up config from the environment');
  createDatabase();
}
