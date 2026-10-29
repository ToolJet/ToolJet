import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LibraryQuery } from '@entities/library_query.entity';
import {
  isLibraryUuid,
  parseLibraryReference,
  resolveLibraryReference,
  LIBRARY_KIND,
} from '@modules/data-queries/library/library-query.util';

// Hold this lock until the caller's transaction commits, including consumer persistence.
export async function lockLibraryQuery(
  manager: EntityManager,
  queryId: string,
  organizationId: string
): Promise<LibraryQuery> {
  await manager.query('SELECT id FROM library_queries WHERE id = $1 AND organization_id = $2 FOR UPDATE', [
    queryId,
    organizationId,
  ]);
  const query = await manager.findOne(LibraryQuery, { where: { id: queryId, organizationId } });
  if (!query) throw new NotFoundException('Library query not found');
  return query;
}

// Batch before any pin write; a stable parent order prevents bulk writes from deadlocking.
// Import callers pass the final remapped pins, never the exporter's IDs.
export async function lockLibraryPins(
  manager: EntityManager,
  organizationId: string,
  queries: { kind?: string; dataSource?: { kind: string }; options?: Record<string, any> }[]
): Promise<void> {
  const pins = queries
    .filter((query) => (query.kind ?? query.dataSource?.kind) === LIBRARY_KIND)
    .map(({ options }) => {
      if (!isLibraryUuid(options?.libraryQueryId)) throw new BadRequestException('A library query ID is required');
      return { queryId: options.libraryQueryId as string, versionId: parseLibraryReference(options).id };
    });
  for (const id of [...new Set(pins.map((pin) => pin.queryId))].sort()) {
    await lockLibraryQuery(manager, id, organizationId);
  }
  for (const pin of pins) await resolveLibraryReference(pin.queryId, pin.versionId, manager);
}
