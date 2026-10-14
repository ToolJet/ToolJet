import { EntityManager } from 'typeorm';

// `data_query_name` matches the key DataQueriesService.assertUniqueQueryName already uses.
export type ValidationLockScope = 'component_name' | 'page_handle' | 'data_query_name';

// Serialises uniqueness checks for one scope and app version until the transaction ends.
export async function lockForValidation(
  manager: EntityManager,
  scope: ValidationLockScope,
  appVersionId: string
): Promise<void> {
  await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${scope}:${appVersionId}`]);
}
