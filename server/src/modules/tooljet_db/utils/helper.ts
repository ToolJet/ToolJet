import { EntityManager } from 'typeorm';

export async function reconfigurePostgrest(
  tooljetDbManager: EntityManager,
  options: { user: string; enableAggregates: boolean }
) {
  await tooljetDbManager.query('CREATE SCHEMA IF NOT EXISTS postgrest');
  await tooljetDbManager.query(`GRANT USAGE ON SCHEMA postgrest to ${options.user}`);
  await tooljetDbManager.query(`create or replace function postgrest.pre_config()
  returns void as $$
    select
      set_config('pgrst.db_aggregates_enabled', '${options.enableAggregates}', false)
  $$ language sql;
  `);
}
