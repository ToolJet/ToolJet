import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { ExecFileSyncOptions, execFileSync } from 'child_process';
import { buildAndValidateDatabaseConfig } from './database-config-utils';
import { isEmpty } from 'lodash';

async function createDatabaseFromFile(envPath: string): Promise<void> {
  const result = dotenv.config({ path: envPath });

  if (process.env.PG_DB_OWNER === 'false') {
    console.log('Skipping database creation');
    return;
  }

  if (result.error) {
    throw result.error;
  }

  await createDatabase();
}

async function createDatabase(): Promise<void> {
  const { value: envVars, error } = buildAndValidateDatabaseConfig();

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  if (envVars.PG_DB_OWNER === 'false') {
    console.log('Skipping database creation');
    return;
  }

  const dbNameFromArg = process.argv[2];

  if (dbNameFromArg) {
    await createDb(envVars, dbNameFromArg);
  } else {
    await createDb(envVars, envVars.PG_DB);
    if (process.env.ENABLE_TOOLJET_DB === 'true') {
      await createTooljetDb(envVars, envVars.TOOLJET_DB);
    }
  }
}

function checkCommandAvailable(command: string) {
  try {
    execFileSync('command', ['-v', command]);
  } catch (error) {
    throw `Error: ${command} not found. Make sure it's installed and available in the system's PATH.`;
  }
}

function executeCreateDb(host: string, port: string, user: string, password: string, dbName: string) {
  const env = Object.assign({}, process.env, { PGPASSWORD: password });
  const createDbArgs = ['-h', host, '-p', port, '-U', user, dbName];
  const options = { env, stdio: 'pipe' } as ExecFileSyncOptions;

  execFileSync('createdb', createDbArgs, options);
}

async function createDb(envVars, dbName): Promise<void> {
  if (isEmpty(dbName)) {
    throw new Error('Database name cannot be empty');
  }

  try {
    executeCreateDb(envVars.PG_HOST, envVars.PG_PORT, envVars.PG_USER, envVars.PG_PASS, dbName);
    console.log(`Created database ${dbName}\n`);
  } catch (error) {
    if (error.message.includes(`database "${dbName}" already exists`)) {
      console.log(`Using Application database\nPG_DB: ${dbName}\nPG_HOST: ${envVars.PG_HOST}\n`);
    } else {
      throw error;
    }
  }
}

async function createTooljetDb(envVars, dbName): Promise<void> {
  if (isEmpty(dbName)) {
    throw new Error('Database name cannot be empty');
  }

  try {
    executeCreateDb(
      envVars.TOOLJET_DB_HOST,
      envVars.TOOLJET_DB_PORT,
      envVars.TOOLJET_DB_USER,
      envVars.TOOLJET_DB_PASS,
      dbName
    );
  } catch (error) {
    if (error.message.includes(`database "${dbName}" already exists`)) {
      console.log(`Using Tooljet database\nTOOLJET_DB: ${dbName}\nTOOLJET_DB_HOST: ${envVars.TOOLJET_DB_HOST}\n`);
    } else {
      throw error;
    }
  }
}

try {
  checkCommandAvailable('dropdb');
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
} catch (error) {
  console.error(error);
  process.exit(1);
}
