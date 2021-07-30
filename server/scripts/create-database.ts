import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { exec } from 'child_process';
import * as Joi from 'joi';

function validateDatabaseConfig(): Joi.ValidationResult {
  const envVarsSchema = Joi.object()
    .keys({
      PG_HOST: Joi.string().required(),
      PG_PORT: Joi.number().positive().default(5432),
      PG_PASS: Joi.string().default(''),
      PG_USER: Joi.string().required(),
      PG_DB: Joi.string().required(),
    })
    .unknown();

  return envVarsSchema.validate(process.env);
}

function createDatabaseFromFile(envPath: string): void {
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw result.error;
  }

  createDatabase();
}

function createDatabase(): void {
  const { value: envVars, error } = validateDatabaseConfig();

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  exec('command -v createdb', (err, _stdout, _stderr) => {
    if (err) {
      console.error(err);
      return;
    }

    const createdb =
      `PGPASSWORD=${envVars.PG_PASS} createdb ` +
      `-h ${envVars.PG_HOST} ` +
      `-p ${envVars.PG_PORT} ` +
      `-U ${envVars.PG_USER} ` +
      process.env.PG_DB;

    exec(createdb, (err, _stdout, _stderr) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Created database ${process.env.PG_DB}`);
    });
  });
}

const nodeEnvPath = path.resolve(
  process.cwd(),
  process.env.NODE_ENV === 'test' ? '../.env.test' : '../.env',
);

const fallbackPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(nodeEnvPath)) {
  createDatabaseFromFile(nodeEnvPath);
} else if (fs.existsSync(fallbackPath)) {
  createDatabaseFromFile(fallbackPath);
} else {
  console.log(
    `${nodeEnvPath} file not found to create database` +
      'Inferring config from the environment',
  );

  createDatabase();
}
