/**
 * cleanup.ts — Database cleanup and generic entity helpers.
 *
 * This module owns:
 * - resetDB() — truncates all tables between test runs
 * - dropTooljetDbTables() — private helper for ToolJet DB internal tables
 * - Generic entity helpers: findEntity, findEntityOrFail, saveEntity, findEntities,
 *   updateEntity, countEntities, getEntityRepository
 *
 * IMPORTANT: This module imports ONLY from ./bootstrap (no circular deps).
 */

import { ObjectLiteral, FindOptionsWhere, EntityTarget, DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { InternalTable } from '@entities/internal_table.entity';
import { getDefaultDataSource, getTooljetDbDataSource } from './bootstrap';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function dropTooljetDbTables() {
  const ds = getDefaultDataSource();
  const tooljetDbDs = getTooljetDbDataSource();

  const internalTables = (await ds.manager.find(InternalTable, { select: ['id'] })) as InternalTable[];

  if (tooljetDbDs) {
    for (const table of internalTables) {
      await tooljetDbDs.query(`DROP TABLE IF EXISTS "${table.id}" CASCADE`);
    }
  }
}

// ---------------------------------------------------------------------------
// resetDB
// ---------------------------------------------------------------------------

export async function resetDB() {
  if (process.env.NODE_ENV !== 'test') return;
  await dropTooljetDbTables();

  const ds = getDefaultDataSource();
  if (!ds.isInitialized) await ds.initialize();

  // Legacy tables removed from DB but still have entity metadata registered
  const skippedTables = [
    'app_group_permissions',
    'data_source_group_permissions',
    'group_permissions',
    'user_group_permissions',
  ];

  const entities = ds.entityMetadatas;

  // Collect all table names that exist in the DB, then TRUNCATE them all in one
  // statement. Must filter out non-existent legacy tables first, because a single
  // TRUNCATE fails entirely if any table is missing.
  const existingRows: { table_name: string }[] = await ds.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const existingSet = new Set(existingRows.map((r) => r.table_name));

  const tables: string[] = [];
  for (const entity of entities) {
    if (skippedTables.includes(entity.tableName)) continue;
    if (entity.tableName === 'instance_settings') continue;
    if (!existingSet.has(entity.tableName)) continue;
    tables.push(`"${entity.tableName}"`);
  }

  if (tables.length > 0) {
    // Terminate lingering backends that may hold locks from previous test files'
    // async operations (e.g., workflow executions completing after app.close()).
    // The current connection's pool will reconnect automatically.
    try {
      await ds.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
          AND state = 'idle in transaction'
      `);
    } catch {}

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await ds.query(`SET lock_timeout = '3s'`);
        await ds.query(`TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
        await ds.query(`SET lock_timeout = 0`);
        break;
      } catch (err: unknown) {
        try { await ds.query(`SET lock_timeout = 0`); } catch {}
        if (attempt < 4) {
          // On first retry, also kill ALL other connections (not just idle-in-transaction)
          if (attempt === 1) {
            try {
              await ds.query(`
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND pid <> pg_backend_pid()
              `);
            } catch {}
          }
          await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
          continue;
        }
        const message = err instanceof Error ? err.message.substring(0, 120) : String(err);
        console.error('resetDB: TRUNCATE failed after 5 attempts:', message);
      }
    }
  }

  // Reset instance_settings to a consistent baseline for every test
  if (existingSet.has('instance_settings')) {
    await ds.query(`UPDATE "instance_settings" SET value='true' WHERE key='ALLOW_PERSONAL_WORKSPACE'`);
  }
}

// ---------------------------------------------------------------------------
// Generic entity helpers
// ---------------------------------------------------------------------------

/**
 * Find a single entity by criteria. Returns null if not found.
 */
export async function findEntity<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where: FindOptionsWhere<T>
): Promise<T | null> {
  const ds = getDefaultDataSource();
  return await ds.manager.findOne(EntityClass, { where });
}

/**
 * Find a single entity by criteria. Throws if not found.
 */
export async function findEntityOrFail<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where: FindOptionsWhere<T>
): Promise<T> {
  const ds = getDefaultDataSource();
  return await ds.manager.findOneOrFail(EntityClass, { where });
}

/**
 * Update an entity by id.
 */
export async function updateEntity<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const ds = getDefaultDataSource();
  await ds.manager.update(EntityClass, id, updates as Parameters<typeof ds.manager.update>[2]);
}

/**
 * Save (insert or update) an entity. Equivalent to ds.manager.save(Entity, data).
 */
export async function saveEntity<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  data: DeepPartial<T>
): Promise<T> {
  const ds = getDefaultDataSource();
  return await ds.manager.save(EntityClass, data);
}

/**
 * Find multiple entities matching criteria.
 */
export async function findEntities<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  options?: FindManyOptions<T>
): Promise<T[]> {
  const ds = getDefaultDataSource();
  return await ds.manager.find(EntityClass, options);
}

/**
 * Count entities matching criteria. If no where clause provided, counts all rows.
 */
export async function countEntities<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where?: FindOptionsWhere<T>
): Promise<number> {
  const ds = getDefaultDataSource();
  return await ds.manager.count(EntityClass, where ? { where } : undefined);
}

/**
 * Delete entities matching criteria.
 */
export async function deleteEntities<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where: FindOptionsWhere<T>
): Promise<void> {
  const ds = getDefaultDataSource();
  await ds.manager.delete(EntityClass, where);
}

/**
 * Get a TypeORM Repository for the given entity class.
 * Use sparingly — prefer findEntity/saveEntity/updateEntity for simple ops.
 */
export function getEntityRepository<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>
): Repository<T> {
  const ds = getDefaultDataSource();
  return ds.getRepository(EntityClass);
}
