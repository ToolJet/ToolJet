/** Typed wrappers around TypeORM operations for test convenience. */
import { ObjectLiteral, FindOptionsWhere, EntityTarget, DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { getDefaultDataSource } from './setup';

/** Finds a single entity by criteria. Returns null if not found. */
export async function findEntity<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where: FindOptionsWhere<T>
): Promise<T | null> {
  const ds = getDefaultDataSource();
  return await ds.manager.findOne(EntityClass, { where });
}

/** Finds a single entity by criteria. Throws if not found. */
export async function findEntityOrFail<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where: FindOptionsWhere<T>
): Promise<T> {
  const ds = getDefaultDataSource();
  return await ds.manager.findOneOrFail(EntityClass, { where });
}

export async function updateEntity<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const ds = getDefaultDataSource();
  await ds.manager.update(EntityClass, id, updates as Parameters<typeof ds.manager.update>[2]);
}

/** Saves (inserts or updates) an entity. */
export async function saveEntity<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  data: DeepPartial<T>
): Promise<T> {
  const ds = getDefaultDataSource();
  return await ds.manager.save(EntityClass, data);
}

export async function findEntities<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  options?: FindManyOptions<T>
): Promise<T[]> {
  const ds = getDefaultDataSource();
  return await ds.manager.find(EntityClass, options);
}

/** Counts entities matching criteria. If no where clause provided, counts all rows. */
export async function countEntities<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where?: FindOptionsWhere<T>
): Promise<number> {
  const ds = getDefaultDataSource();
  return await ds.manager.count(EntityClass, where ? { where } : undefined);
}

export async function deleteEntities<T extends ObjectLiteral>(
  EntityClass: EntityTarget<T>,
  where: FindOptionsWhere<T>
): Promise<void> {
  const ds = getDefaultDataSource();
  await ds.manager.delete(EntityClass, where);
}

/**
 * Returns a TypeORM Repository for the given entity class.
 * Prefer findEntity/saveEntity/updateEntity for simple operations.
 */
export function getEntityRepository<T extends ObjectLiteral>(EntityClass: EntityTarget<T>): Repository<T> {
  const ds = getDefaultDataSource();
  return ds.getRepository(EntityClass);
}

/** Placeholder UUID guaranteed not to exist in the test database — for 400/404 validation tests. */
export const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

/** Generates a collision-free test email for parallel/repeated test runs. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@tooljet.io`;
}
