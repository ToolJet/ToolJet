import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

function buildConnectionOptions(
  filePath: string,
  env: string | undefined,
): TypeOrmModuleOptions {

  let data: any = process.env;
  
  if(fs.existsSync(filePath)) {
    data = { ...data, ...dotenv.parse(fs.readFileSync(filePath))};
  }

  /* use the database connection URL if available ( Heroku postgres addon uses connection URL ) */

  const connectionParams = process.env.DATABASE_URL ? {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    database: data.PG_DB,
    port: +data.PG_PORT || 5432,
    username: data.PG_USER,
    password: data.PG_PASS,
    host: data.PG_HOST,
  }

  const entitiesDir =
    process.env.NODE_ENV === 'test'
      ? [__dirname + '/**/*.entity.ts']
      : [__dirname + '/**/*.entity{.js,.ts}'];

  return {
    type: 'postgres',
    ...connectionParams,
    entities: entitiesDir,
    synchronize: false,
    uuidExtension: 'pgcrypto',
    migrationsRun: false,
    logging: data.ORM_LOGGING || false,
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    cli: {
      migrationsDir: 'migrations',
    },
  };
}

function determineFilePathForEnv(env: string | undefined): string {
  if (env === 'test') {
    return path.resolve(process.cwd(), '../.env.test');
  } else {
    return path.resolve(process.cwd(), '../.env');
  }
}

function throwErrorIfFileNotPresent(filePath: string, env: string): void {
  if (!fs.existsSync(filePath)) {
    console.log(
      `Unable to fetch database config from env file for environment: ${env}\n` +
        'Picking up config from the environment',
    );
  }
}

function fetchConnectionOptions(): TypeOrmModuleOptions {
  const env: string | undefined = process.env.NODE_ENV;
  const filePath: string = determineFilePathForEnv(env);
  throwErrorIfFileNotPresent(filePath, env);

  return buildConnectionOptions(filePath, env);
}

const ormconfig: TypeOrmModuleOptions = fetchConnectionOptions();
export default ormconfig;
