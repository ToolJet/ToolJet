import * as Joi from 'joi';
import * as path from 'path';

export function filePathForEnvVars(env: string | undefined): string {
  if (env === 'test') {
    return path.resolve(process.cwd(), '../.env.test');
  } else {
    return path.resolve(process.cwd(), '../.env');
  }
}

function buildDatabaseConfig(): any {
  return {
    PG_HOST: process.env.PG_HOST,
    PG_PORT: process.env.PG_PORT,
    PG_PASS: process.env.PG_PASS,
    PG_USER: process.env.PG_USER,
    PG_DB: process.env.PG_DB,
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
      PG_DB: Joi.string().default('tooljet_db'),
      PG_DB_OWNER: Joi.string().default('true'),
    })
    .unknown();

  return envVarsSchema.validate(dbOptions);
}

export function buildAndValidateDatabaseConfig(): Joi.ValidationResult {
  const dbOptions: any = buildDatabaseConfig();

  return validateDatabaseConfig(dbOptions);
}
