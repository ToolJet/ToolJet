import { getManager, MigrationInterface, QueryRunner } from 'typeorm';
import { getEnvVars } from '../scripts/database-config-utils';

// This migration is a prerequisite for tooljetDb and incase the PG_USER
// dont have createdb privileges, this migration needs to be run for
// internal storage to function
export class CreateTooljetDb1665507074072 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const data = getEnvVars();
    if (data.PG_DB_OWNER !== 'false') {
      // Database creation can't be made inside a transaction block which queryRunner is run inside.
      // Thus we get a new connection to create the database first.
      try {
        await getManager().query(`CREATE DATABASE ${data.TOOLJET_DB} WITH OWNER ${data.PG_USER};`);
      } catch (err) {
        const errorMessage = `database "${data.TOOLJET_DB}" already exists`;
        if (err.message.includes(errorMessage)) return;
        throw err;
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    const data = getEnvVars();
    if (data.PG_DB_OWNER !== 'false') {
      await getManager().query(`DROP DATABASE ${data.TOOLJET_DB}`);
    }
  }
}
