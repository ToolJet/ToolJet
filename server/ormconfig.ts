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

  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    autoLoadEntities: true,
    synchronize: false,
    uuidExtension: 'pgcrypto',
    migrationsRun: false,
    logging: data.ORM_LOGGING || false,
    migrations: ['dist/migrations/**/*{.ts,.js}'],
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
      `Unable to fetch database config from env file for environment: ${env}\n `
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
