import * as Joi from 'joi';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { isEmpty } from 'lodash';
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
    data = { ...data, ...dotenv.parse(fs.readFileSync(envVarsFilePath)) };
  }
  data = {
    ...data,
    ...(data.DATABASE_URL && buildDbConfigFromDatabaseURL(data)),
  };

  return data;
}

function buildDbConfigFromDatabaseURL(data): any {
  const parsedUrl = url.parse(data.DATABASE_URL, false, true);

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

  const { value: dbConfig, error } = validateDatabaseConfig({
    DATABASE_URL: data.DATBASE_URL,
    PG_HOST: config.host,
    PG_PORT: config.port,
    PG_PASS: config.password,
    PG_USER: config.user,
    PG_DB: config.database,
    PG_DB_OWNER: data.PG_DB_OWNER,
    ENABLE_TOOLJET_DB: data.ENABLE_TOOLJET_DB,
    TOOLJET_DB: data.TOOLJET_DB,
    TOOLJET_DB_OWNER: data.TOOLJET_DB_OWNER,
    TOOLJET_DB_HOST: config.host,
    TOOLJET_DB_PORT: config.port,
    TOOLJET_DB_PASS: config.password,
    TOOLJET_DB_USER: config.user,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return removeEmptyKeys(dbConfig);
}

function removeEmptyKeys(obj) {
  return Object.entries(obj)
    .filter(([_, v]) => !isEmpty(v))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

function validateDatabaseConfig(dbConfig: any): Joi.ValidationResult {
  const envVarsSchema = Joi.object()
    .keys({
      PG_HOST: Joi.string().default('localhost'),
      PG_PORT: Joi.number().positive().default(5432),
      PG_PASS: Joi.string().default(''),
      PG_USER: Joi.string().required(),
      PG_DB: Joi.string().default('tooljet_production'),
      PG_DB_OWNER: Joi.string().default('true'),
      ...(dbConfig.ENABLE_TOOLJET_DB === 'true' && {
        TOOLJET_DB_HOST: Joi.string().default('localhost'),
        TOOLJET_DB_PORT: Joi.number().positive().default(5432),
        TOOLJET_DB_PASS: Joi.string().default(''),
        TOOLJET_DB_USER: Joi.string().required(),
        TOOLJET_DB: Joi.string().default('tooljet_db'),
        TOOLJET_DB_OWNER: Joi.string().default('true'),
      }),
    })
    .unknown();

  return envVarsSchema.validate(dbConfig);
}

export function buildAndValidateDatabaseConfig(): Joi.ValidationResult {
  const config: any = getEnvVars();
  const dbConfig = {
    PG_HOST: config.PG_HOST,
    PG_PORT: config.PG_PORT,
    PG_PASS: config.PG_PASS,
    PG_USER: config.PG_USER,
    PG_DB: config.PG_DB,
    PG_DB_OWNER: config.PG_DB_OWNER,
    ENABLE_TOOLJET_DB: config.ENABLE_TOOLJET_DB,
    TOOLJET_DB: config.TOOLJET_DB,
    TOOLJET_DB_HOST: config.TOOLJET_DB_HOST,
    TOOLJET_DB_PORT: config.TOOLJET_DB_PORT,
    TOOLJET_DB_PASS: config.TOOLJET_DB_PASS,
    TOOLJET_DB_USER: config.TOOLJET_DB_USER,
    TOOLJET_DB_OWNER: config.TOOLJET_DB_OWNER,
  };

  return validateDatabaseConfig(dbConfig);
}
