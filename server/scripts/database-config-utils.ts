import * as Joi from 'joi';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { isEmpty } from 'lodash';
import { createConnection } from 'typeorm';
const url = require('url');
const querystring = require('querystring');

export function filePathForEnvVars(env: string | undefined): string {
  if (env === 'test') {
    return path.resolve(process.cwd(), '../.env.test');
  } else {
    return path.resolve(process.cwd(), '../.env');
  }
}

export function getEnvVars() {
  let data: any = process.env;
  const envVarsFilePath = filePathForEnvVars(process.env.NODE_ENV);

  if (fs.existsSync(envVarsFilePath)) {
    data = { ...data, ...buildDatabaseConfig(), ...dotenv.parse(fs.readFileSync(envVarsFilePath)) };
  }
  return data;
}

export async function createTooljetDbConnection() {
  const data = getEnvVars();
  return await createConnection({
    name: 'tooljetDb',
    type: 'postgres',
    host: data.PG_HOST,
    port: data.PG_PORT,
    username: data.PG_USER,
    password: data.PG_PASS,
    database: data.TOOLJET_DB,
  });
}

function buildDatabaseConfig(): any {
  if (isEmpty(process.env.DATABASE_URL)) {
    return {
      PG_HOST: process.env.PG_HOST,
      PG_PORT: process.env.PG_PORT,
      PG_PASS: process.env.PG_PASS,
      PG_USER: process.env.PG_USER,
      PG_DB: process.env.PG_DB,
      TOOLJET_DB: process.env.TOOLJET_DB,
      PG_DB_OWNER: process.env.PG_DB_OWNER,
    };
  }

  const parsedUrl = url.parse(process.env.DATABASE_URL, false, true);

  const config = querystring.parse(parsedUrl.query);
  config.driver = parsedUrl.protocol.replace(/:$/, '');

  if (parsedUrl.auth) {
    const userPassword = parsedUrl.auth.split(':', 2);
    config.user = userPassword[0];

    if (userPassword.length > 1) config.password = userPassword[1];
    if (parsedUrl.pathname) config.database = parsedUrl.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (parsedUrl.hostname) config.host = parsedUrl.hostname;
    if (parsedUrl.port) config.port = parsedUrl.port;
  }

  return {
    PG_HOST: config.host,
    PG_PORT: config.port,
    PG_PASS: config.password,
    PG_USER: config.user,
    PG_DB: config.database,
    TOOLJET_DB: process.env.TOOLJET_DB,
    PG_DB_OWNER: process.env.PG_DB_OWNER,
  };
}

function validateDatabaseConfig(dbOptions: any): Joi.ValidationResult {
  const envVarsSchema = Joi.object()
    .keys({
      PG_HOST: Joi.string().default('localhost'),
      PG_PORT: Joi.number().positive().default(5432),
      PG_PASS: Joi.string().default(''),
      PG_USER: Joi.string().required(),
      PG_DB: Joi.string().default('tooljet_production'),
      TOOLJET_DB: Joi.string().default('tooljet_db'),
      PG_DB_OWNER: Joi.string().default('true'),
    })
    .unknown();

  return envVarsSchema.validate(dbOptions);
}

export function buildAndValidateDatabaseConfig(): Joi.ValidationResult {
  const dbOptions: any = buildDatabaseConfig();

  return validateDatabaseConfig(dbOptions);
}
