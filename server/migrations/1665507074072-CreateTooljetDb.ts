import { getManager, MigrationInterface, QueryRunner } from 'typeorm';
import { createTooljetDbConnection, getEnvVars } from '../scripts/database-config-utils';

export class CreateTooljetDb1665507074072 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const data = getEnvVars();
    if (data.PG_DB_OWNER !== 'false') {
      await queryRunner.query(`REVOKE connect ON DATABASE ${data.PG_DB} FROM PUBLIC;`);
      // Database creation can't be made inside a transaction block which queryRunner is run inside.
      // Thus we get a new connection to create the database first.
      await getManager().query(`CREATE DATABASE ${data.TOOLJET_DB} WITH OWNER ${data.PG_USER};`);

      // Establish a new connection to tooljetDb to revoke all public schema access.
      // We need to establish and run query onto a different database.
      // this needs to be done outside the migration transaction block.
      const connection = await createTooljetDbConnection();
      const tooljetDbQueryRunner = connection.createQueryRunner();
      // Only the db owner will be able to access details on information_schema and public schema.
      await tooljetDbQueryRunner.query('REVOKE ALL ON SCHEMA public FROM PUBLIC;');
      await tooljetDbQueryRunner.query('REVOKE ALL ON SCHEMA information_schema FROM PUBLIC;');
      await tooljetDbQueryRunner.query('ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;');
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    const data = getEnvVars();
    const connection = await createTooljetDbConnection();
    const tooljetDbQueryRunner = connection.createQueryRunner();

    if (data.PG_DB_OWNER !== 'false') {
      await tooljetDbQueryRunner.query(`DROP DATABASE ${data.TOOLJET_DB}`);
    }
  }
}
