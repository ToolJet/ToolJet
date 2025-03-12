import { getEnvVars } from '../scripts/database-config-utils';
import { createMigrationConnectionForToolJetDatabase } from 'src/helpers/tjdb.migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableAggregationInTooljetDatabase1718264886184 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    console.log('Entering Migration --- EnableAggregationInTooljetDatabase');

    const tooljetDbUser = envData.TOOLJET_DB_USER;
    const { tooljetDbConnection, tooljetDbManager } = await createMigrationConnectionForToolJetDatabase(
      'tooljetDbAggregateMigration'
    );
    try {
      await tooljetDbManager.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.queryRunner.query('CREATE SCHEMA IF NOT EXISTS postgrest');
        console.log(`Migration: EnableAggregationInTooljetDatabase --- Created new schema 'postgrest'`);

        await transactionalEntityManager.queryRunner.query(`GRANT USAGE ON SCHEMA postgrest to ${tooljetDbUser}`);
        console.log(
          `Migration: EnableAggregationInTooljetDatabase --- Granted 'postgrest' schema access to tooljet database user`
        );

        await transactionalEntityManager.queryRunner.query(`create or replace function postgrest.pre_config()
        returns void as $$
          select
            set_config('pgrst.db_aggregates_enabled', 'true', false)
        $$ language sql;
        `);
        console.log(
          `Migration: EnableAggregationInTooljetDatabase ---- Successfully created pre_config function for postgrest`
        );
        await transactionalEntityManager.queryRunner.query("NOTIFY pgrst, 'reload schema'");
      });
    } catch (error) {
      console.error('Error during migration: EnableAggregationInTooljetDatabase --- ', error);
      throw error;
    } finally {
      await tooljetDbConnection.destroy();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
