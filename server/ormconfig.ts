import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getEnvVars } from './scripts/database-config-utils';

function sslConfig(envVars) {
  let config = {};

  if (envVars?.DATABASE_URL) config = { ssl: { rejectUnauthorised: false } };
  if (envVars?.CA_CERT)
    config = {
      ssl: { rejectUnauthorised: false, ca: envVars.CA_CERT },
    };

  return config;
}

function buildConnectionOptions(data): TypeOrmModuleOptions {
  const connectionParams = {
    database: data.PG_DB,
    port: +data.PG_PORT || 5432,
    username: data.PG_USER,
    password: data.PG_PASS,
    host: data.PG_HOST,
    connectTimeoutMS: 5000,
    extra: {
      max: 25,
    },
    ...(sslConfig(data))
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

function buildToolJetDbConnectionOptions(data): TypeOrmModuleOptions {
  const connectionParams = {
    database: data.TOOLJET_DB,
    port: +data.PG_PORT || 5432,
    username: data.PG_USER,
    password: data.PG_PASS,
    host: data.PG_HOST,
    connectTimeoutMS: 5000,
    extra: {
      max: 25,
    },
    ...(sslConfig(data))
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

function fetchConnectionOptions(type: string): TypeOrmModuleOptions {
  const data = getEnvVars();
  switch (type) {
    case 'postgres':
      return buildConnectionOptions(data);
    case 'tooljetDb':
      return buildToolJetDbConnectionOptions(data);
  }
}

const ormconfig: TypeOrmModuleOptions = fetchConnectionOptions('postgres');
const tooljetDbOrmconfig: TypeOrmModuleOptions = fetchConnectionOptions('tooljetDb');

export { ormconfig, tooljetDbOrmconfig };
export default ormconfig;
