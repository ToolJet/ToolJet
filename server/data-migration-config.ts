import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getEnvVars } from './scripts/database-config-utils';

function sslConfig(envVars) {
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

function buildConnectionOptions(): TypeOrmModuleOptions {
  const data = getEnvVars();
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
    ...sslConfig(data),
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
    migrations: [__dirname + '/data-migrations/**/*{.ts,.js}'],
    keepConnectionAlive: true,
    cli: {
      migrationsDir: 'migrations',
    },
  };
}

const ormconfig: TypeOrmModuleOptions = buildConnectionOptions();
export default ormconfig;
