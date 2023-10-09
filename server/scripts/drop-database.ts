import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { ExecFileSyncOptions, exec, execFileSync } from 'child_process';
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

function checkCommandAvailable(command: string) {
  try {
    execFileSync('command', ['-v', command]);
  } catch (error) {
    throw `Error: ${command} not found. Make sure it's installed and available in the system's PATH.`;
  }
}

function dropDb(envVars, dbName) {
  const env = Object.assign({}, process.env, { PGPASSWORD: envVars.PG_PASS });
  const dropDbArgs = ['-h', envVars.PG_HOST, '-p', envVars.PG_PORT, '-U', envVars.PG_USER, dbName];
  const options = { env, stdio: 'pipe' } as ExecFileSyncOptions;

  try {
    execFileSync('dropdb', dropDbArgs, options);
    console.log(`Dropped database ${dbName}`);
  } catch (error) {
    const errorMessage = `database "${dbName}" does not exist`;

    if (error.message.includes(errorMessage)) {
      console.log(errorMessage);
    } else {
      console.error(errorMessage);
      process.exit(1);
    }
  }
}

try {
  checkCommandAvailable('dropdb');
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
} catch (error) {
  console.error(error);
  process.exit(1);
}
