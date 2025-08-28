import { EntityManager } from 'typeorm';

export async function reconfigurePostgrest(
  tooljetDbManager: EntityManager,
  options: { user: string; enableAggregates: boolean; statementTimeoutInSecs: number }
) {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use advisory locks outside of transaction to prevent concurrent execution
      await tooljetDbManager.query('SELECT pg_advisory_lock(123456788)');

      try {
        await tooljetDbManager.transaction(async (transactionalEntityManager) => {
          await transactionalEntityManager.queryRunner.query('CREATE SCHEMA IF NOT EXISTS postgrest');

          // Check if the grant already exists before applying it
          const grantExists = await transactionalEntityManager.queryRunner.query(
            `
            SELECT 1 FROM information_schema.usage_privileges 
            WHERE grantee = $1 AND object_schema = 'postgrest' AND privilege_type = 'USAGE'
          `,
            [options.user]
          );

          if (!grantExists || grantExists.length === 0) {
            await transactionalEntityManager.queryRunner.query(`GRANT USAGE ON SCHEMA postgrest to ${options.user}`);
          }

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
      } finally {
        // Always release the advisory lock (outside of transaction)
        try {
          await tooljetDbManager.query('SELECT pg_advisory_unlock(123456788)');
        } catch (unlockError) {
          console.warn('Failed to release advisory lock:', unlockError);
        }
      }

      // If we reach here, the operation was successful
      return;
    } catch (error) {
      console.error(`The tooljet database reconfiguration process encountered an error on attempt ${attempt}:`, error);

      // Check if it's a concurrency error or transaction abort
      if (
        (error.code === 'XX000' && error.message?.includes('tuple concurrently updated')) ||
        (error.code === '25P02' && error.message?.includes('current transaction is aborted'))
      ) {
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      // If it's not a retryable error or we've exhausted retries, throw the error
      throw error;
    }
  }
}

/**
 * Cloud TJDB SQL Disabled: Postgrest configuration without schema synchronization
 * Postgres schema for each workspace is not loaded into Postgrest.
 */
export async function reconfigurePostgrestWithoutSchemaSync(
  tooljetDbManager: EntityManager,
  options: { user: string; enableAggregates: boolean; statementTimeoutInSecs: number }
) {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use advisory locks outside of transaction to prevent concurrent execution
      await tooljetDbManager.query('SELECT pg_advisory_lock(123456789)');

      try {
        await tooljetDbManager.transaction(async (transactionalEntityManager) => {
          await transactionalEntityManager.queryRunner.query('CREATE SCHEMA IF NOT EXISTS postgrest');

          // Check if the grant already exists before applying it
          const grantExists = await transactionalEntityManager.queryRunner.query(
            `
            SELECT 1 FROM information_schema.usage_privileges 
            WHERE grantee = $1 AND object_schema = 'postgrest' AND privilege_type = 'USAGE'
          `,
            [options.user]
          );

          if (!grantExists || grantExists.length === 0) {
            await transactionalEntityManager.queryRunner.query(`GRANT USAGE ON SCHEMA postgrest to ${options.user}`);
          }

          await transactionalEntityManager.queryRunner.query(`create or replace function postgrest.pre_config()
          returns void as $$
            select
              set_config('pgrst.db_aggregates_enabled', '${options.enableAggregates}', false);
          $$ language sql;
          `);

          await transactionalEntityManager.queryRunner.query(
            `ALTER ROLE ${options.user} SET statement_timeout TO '${options.statementTimeoutInSecs}s'`
          );
        });
      } finally {
        // Always release the advisory lock (outside of transaction)
        try {
          await tooljetDbManager.query('SELECT pg_advisory_unlock(123456789)');
        } catch (unlockError) {
          console.warn('Failed to release advisory lock:', unlockError);
        }
      }

      // If we reach here, the operation was successful
      return;
    } catch (error) {
      console.error(`The tooljet database reconfiguration process encountered an error on attempt ${attempt}:`, error);

      // Check if it's a concurrency error or transaction abort
      if (
        (error.code === 'XX000' && error.message?.includes('tuple concurrently updated')) ||
        (error.code === '25P02' && error.message?.includes('current transaction is aborted'))
      ) {
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      // If it's not a retryable error or we've exhausted retries, throw the error
      throw error;
    }
  }
}
