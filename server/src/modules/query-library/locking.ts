import { matchLibraryQuery } from '@modules/data-queries/library/library-export.util';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LibraryQuery } from '@entities/library_query.entity';
import {
  isLibraryUuid,
  parseLibraryReference,
  resolveLibraryReference,
  LIBRARY_KIND,
} from '@modules/data-queries/library/library-query.util';

// One plan spans recursive imports sharing a transaction manager. Newly inserted
// parents can join it; a concurrently discovered existing parent requires a retry.
const importLocks = new WeakMap<EntityManager, Set<string>>();

// Hold this lock until the caller's transaction commits, including consumer persistence.
export async function lockLibraryQuery(
  manager: EntityManager,
  queryId: string,
  organizationId: string
): Promise<LibraryQuery> {
  const planned = importLocks.get(manager);
  if (planned && !planned.has(queryId))
    throw new ConflictException('Library queries changed during import. Retry the import.');
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

export function registerImportedLibraryQuery(manager: EntityManager, queryId: string): void {
  importLocks.get(manager)?.add(queryId);
}

// Call once before recursively importing modules, not after each child's writes.
// The current bundle's identity/reference fields are independent of snapshot format.
export async function withLibraryImportLocks<T>(
  manager: EntityManager,
  organizationId: string,
  bundle: any,
  isGitApp: boolean,
  operation: () => Promise<T>
): Promise<T> {
  if (importLocks.has(manager)) return operation();
  const existing = await manager.find(LibraryQuery, { where: { organizationId } });
  const parents = new Set<string>();
  const visited = new WeakSet<object>();
  const visit = (item: any) => {
    const app = item?.appV2 ?? item;
    if (!app || typeof app !== 'object' || visited.has(app)) return;
    visited.add(app);
    const bundled = !isGitApp && Array.isArray(app.libraryQueries) ? app.libraryQueries : [];
    const claimed = new Set<string>();
    for (const incoming of bundled) {
      const target = matchLibraryQuery(existing, incoming, claimed);
      if (target) {
        claimed.add(target.id);
        parents.add(target.id);
      }
    }
    const bundledIds = new Set(bundled.map((query) => query.id));
    for (const query of app.dataQueries ?? []) {
      const source = (app.dataSources ?? []).find((source) => source.id === query.dataSourceId);
      if ((source?.kind ?? query.kind) !== LIBRARY_KIND) continue;
      const id = query.options?.libraryQueryId;
      if (!bundledIds.has(id) && isLibraryUuid(id)) parents.add(id);
    }
    for (const child of app.modules ?? []) visit(child);
  };
  visit(bundle);
  for (const id of [...parents].sort()) await lockLibraryQuery(manager, id, organizationId);
  importLocks.set(manager, parents);
  try {
    return await operation();
  } finally {
    importLocks.delete(manager);
  }
}
