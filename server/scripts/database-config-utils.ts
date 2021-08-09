import * as Joi from 'joi';

function buildDatabaseConfig(): any {
  return {
    PG_HOST: process.env.PG_HOST,
    PG_PORT: process.env.PG_PORT,
    PG_PASS: process.env.PG_PASS,
    PG_USER: process.env.PG_USER,
    PG_DB: process.env.PG_DB,
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
    })
    .unknown();

  return envVarsSchema.validate(dbOptions);
}

export function buildAndValidateDatabaseConfig(): Joi.ValidationResult {
  const dbOptions: any = buildDatabaseConfig();

  return validateDatabaseConfig(dbOptions);
}
