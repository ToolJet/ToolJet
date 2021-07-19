import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const generateConfig = (envPath: string): void => {
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    return fs.unlinkSync('ormconfig.json');
  }

  const dbConfig = {
    type: 'postgres',
    database: process.env.TYPEORM_DATABASE,
    port: process.env.TYPEORM_PORT || 5432,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    host: process.env.TYPEORM_HOST,
    synchronize: false,
    migrationsRun: false,
    logging: process.env.TYPEORM_LOGGING || 'all',
    entities: [process.env.TYPEORM_ENTITIES],
    migrations: [process.env.TYPEORM_MIGRATIONS],
    cli: {
      migrationsDir: process.env.TYPEORM_MIGRATIONS_DIR,
    },
  };

  fs.writeFileSync('ormconfig.json', JSON.stringify(dbConfig, null, 2));
};

const nodeEnvPath: string = path.resolve(
  process.cwd(),
  `.env.${process.env.NODE_ENV}`,
);

const fallbackPath: string = path.resolve(process.cwd(), '.env');

if (fs.existsSync(nodeEnvPath)) {
  generateConfig(nodeEnvPath);
} else if (fs.existsSync(fallbackPath)) {
  generateConfig(fallbackPath);
} else {
  console.error(
    `.env.${process.env.NODE_ENV} file not found to generate ormconfig.json`,
  );
}
