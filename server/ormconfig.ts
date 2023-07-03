import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getEnvVars } from './scripts/database-config-utils';

function dbSslConfig(envVars) {
  let config = {};

  if (envVars?.DATABASE_URL)
    config = {
      url: envVars.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };

  if (envVars?.CA_CERT)
    config = {
      ...config,
      ...{ ssl: { rejectUnauthorized: false, ca: envVars.CA_CERT } },
    };

  return config;
}

function tooljetDbSslConfig(envVars) {
  let config = {};

  if (envVars?.TOOLJET_DB_URL)
    config = {
      url: envVars.TOOLJET_DB_URL,
      ssl: { rejectUnauthorized: false },
    };

  if (envVars?.CA_CERT)
    config = {
      ...config,
      ...{ ssl: { rejectUnauthorized: false, ca: envVars.CA_CERT } },
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
    ...dbSslConfig(data),
  };

  const entitiesDir =
    data?.NODE_ENV === 'test' ? [__dirname + '/**/*.entity.ts'] : [__dirname + '/**/*.entity{.js,.ts}'];

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
    port: +data.TOOLJET_DB_PORT || 5432,
    username: data.TOOLJET_DB_USER,
    password: data.TOOLJET_DB_PASS,
    host: data.TOOLJET_DB_HOST,
    connectTimeoutMS: 5000,
    extra: {
      max: 25,
    },
    ...tooljetDbSslConfig(data),
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
