import { tooljetDbOrmconfig } from 'ormconfig';
import { getEnvVars } from 'scripts/database-config-utils';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { createConnection } from 'typeorm';

export class EnableAggregationInTooljetDatabase1718264886184 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    const isToolJetDBEnabled = envData.ENABLE_TOOLJET_DB;

    if (isToolJetDBEnabled !== 'true') return;
    console.log('Entering Migration --- EnableAggregationInTooljetDatabase');
    const tooljetDbConnection = await createConnection({
      ...tooljetDbOrmconfig,
      name: 'tooljetDbAggregateMigration',
    } as any);

    const tooljetDbManager = tooljetDbConnection.createEntityManager();
    const tooljetDbUser = envData.TOOLJET_DB_USER;

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
      await tooljetDbConnection.close();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
