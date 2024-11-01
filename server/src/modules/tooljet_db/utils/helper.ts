import { EntityManager } from 'typeorm';

export async function reconfigurePostgrest(
  tooljetDbManager: EntityManager,
  options: { user: string; enableAggregates: boolean; statementTimeoutInSecs: number }
) {
  try {
    await tooljetDbManager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.queryRunner.query('CREATE SCHEMA IF NOT EXISTS postgrest');
      await transactionalEntityManager.queryRunner.query(`GRANT USAGE ON SCHEMA postgrest to ${options.user}`);
      await transactionalEntityManager.queryRunner.query(`create or replace function postgrest.pre_config()
      returns void as $$
        select
          set_config('pgrst.db_aggregates_enabled', '${options.enableAggregates}', false);
        select
          set_config('pgrst.db_schemas', string_agg(nspname, ','), true)
        from pg_namespace
        where nspname like 'workspace_%';
      $$ language sql;
      `);
      await transactionalEntityManager.queryRunner.query(
        `ALTER ROLE ${options.user} SET statement_timeout TO '${options.statementTimeoutInSecs}s'`
      );
    });
  } catch (error) {
    console.error('The tooljet database reconfiguration process encountered an error.', error);
    throw error;
  }
}
