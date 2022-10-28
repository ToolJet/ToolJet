import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

function getEnvVars(filePath: string) {
  let data: any = process.env;

  if (fs.existsSync(filePath)) {
    data = { ...data, ...dotenv.parse(fs.readFileSync(filePath)) };
  }

  return data
}

function buildConnectionOptions(filePath: string, env: string | undefined): TypeOrmModuleOptions {
  const data =  getEnvVars(filePath)
  /* use the database connection URL if available ( Heroku postgres addon uses connection URL ) */
  const connectionParams = process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false, ca: process.env.CA_CERT },
      }
    : {
        database: data.PG_DB,
        port: +data.PG_PORT || 5432,
        username: data.PG_USER,
        password: data.PG_PASS,
        host: data.PG_HOST,
        connectTimeoutMS: 5000,
        extra: {
          max: 25,
        },
      };

  const entitiesDir =
    process.env.NODE_ENV === 'test' ? [__dirname + '/**/*.entity.ts'] : [__dirname + '/**/*.entity{.js,.ts}'];

  return {
    type: 'postgres',
    ...connectionParams,
    entities: entitiesDir,
    synchronize: false,
    uuidExtension: 'pgcrypto',
    migrationsRun: false,
    migrationsTransactionMode: 'all',
    logging: data.ORM_LOGGING || false,
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    keepConnectionAlive: true,
    cli: {
      migrationsDir: 'migrations',
    },
  };
}

function buildToolJetDbConnectionOptions(filePath: string, env: string | undefined): TypeOrmModuleOptions {
  const data =  getEnvVars(filePath)
  /* use the database connection URL if available ( Heroku postgres addon uses connection URL ) */
  const connectionParams = process.env.DATABASE_URL
    ? {
        url: process.env.TOOLJET_DB_URL,
        ssl: { rejectUnauthorized: false, ca: process.env.CA_CERT },
      }
    : {
        database: data.TOOLJET_DB,
        port: +data.PG_PORT || 5432,
        username: data.PG_USER,
        password: data.PG_PASS,
        host: data.PG_HOST,
        connectTimeoutMS: 5000,
        extra: {
          max: 25,
        },
      };

  return {
    name: 'tooljetDb',
    type: 'postgres',
    ...connectionParams,
    synchronize: false,
    uuidExtension: 'pgcrypto',
    migrationsRun: false,
    migrationsTransactionMode: 'all',
    logging: data.ORM_LOGGING || false,
    keepConnectionAlive: true,
  };
}

function determineFilePathForEnv(env: string | undefined): string {
  if (env === 'test') {
    return path.resolve(process.cwd(), '../.env.test');
  } else {
    return path.resolve(process.cwd(), '../.env');
  }
}

function fetchConnectionOptions(type: string): TypeOrmModuleOptions {
  const env: string | undefined = process.env.NODE_ENV;
  const filePath: string = determineFilePathForEnv(env);

  switch (type) {
    case 'postgres':
      return buildConnectionOptions(filePath, env)
    case 'tooljetDb':
      return buildToolJetDbConnectionOptions(filePath, env)
  }
}

const ormconfig: TypeOrmModuleOptions = fetchConnectionOptions('postgres');
const tooljetDbOrmconfig: TypeOrmModuleOptions = fetchConnectionOptions('tooljetDb');

export {ormconfig, tooljetDbOrmconfig};
export default ormconfig;
