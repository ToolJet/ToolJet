import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { filePathForEnvVars } from '../scripts/database-config-utils';

export class MaybeCreateExtension1625814801415 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let data: any = process.env;
    const envVarsFilePath = filePathForEnvVars(process.env.NODE_ENV);

    if (fs.existsSync(envVarsFilePath)) {
      data = { ...data, ...dotenv.parse(fs.readFileSync(envVarsFilePath)) };
    }
    if (data.PG_DB_OWNER !== 'false') {
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
