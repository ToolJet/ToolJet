import { randomUUID } from 'crypto';
import { EntityManager, In } from 'typeorm';
import { Component } from 'src/entities/component.entity';

/**
 * Components created before co_relation_id was assigned on creation have none. One is given the first time such a
 * component is copied into a new version, and written to the source row as well, so the two copies share it and a
 * version compare can tell a renamed component from a new one. Only components that get copied are touched.
 *
 * The UPDATE keeps an id that a concurrent copy wrote first, and the ids are read back, so the copy always matches
 * its source.
 */
export async function assignMissingComponentCoRelationIds(
  components: Pick<Component, 'id' | 'co_relation_id'>[],
  manager: EntityManager
): Promise<void> {
  const missing = components.filter((component) => !component.co_relation_id);
  if (missing.length === 0) return;

  await manager.query(
    `UPDATE components SET co_relation_id = COALESCE(components.co_relation_id, u.co_relation_id)
     FROM unnest($1::uuid[], $2::uuid[]) AS u(id, co_relation_id)
     WHERE components.id = u.id`,
    [missing.map((component) => component.id), missing.map(() => randomUUID())]
  );

  const stored = await manager.find(Component, {
    select: ['id', 'co_relation_id'],
    where: { id: In(missing.map((component) => component.id)) },
  });
  const coRelationIdOf = new Map(stored.map((row) => [row.id, row.co_relation_id]));
  for (const component of missing) component.co_relation_id = coRelationIdOf.get(component.id);
}
