import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getEnvVars } from "./scripts/database-config-utils";

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
    ...(process.env.CA_CERT && {
      ssl: { rejectUnauthorized: false, ca: process.env.CA_CERT },
    }),
  };

  const entitiesDir =
    process.env.NODE_ENV === "test"
      ? [__dirname + "/**/*.entity.ts"]
      : [__dirname + "/**/*.entity{.js,.ts}"];

  return {
    type: "postgres",
    ...connectionParams,
    entities: entitiesDir,
    synchronize: false,
    uuidExtension: "pgcrypto",
    migrationsRun: false,
    migrationsTransactionMode: "all",
    logging: data.ORM_LOGGING || false,
    migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
    keepConnectionAlive: true,
    cli: {
      migrationsDir: "migrations",
    },
  };
}

const ormconfig: TypeOrmModuleOptions = buildConnectionOptions();
export default ormconfig;
