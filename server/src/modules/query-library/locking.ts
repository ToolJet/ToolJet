import {
  assertLibraryExport,
  LibraryExportQuery,
  matchLibraryQuery,
} from '@modules/data-queries/library/library-export.util';
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

// A query row as callers hold it: its own `kind`, or its data source's.
type QueryLike = { kind?: string; dataSource?: { kind: string }; options?: object | null };
// `previous` is the stored row before this write; omit it for a row that did not exist.
export type LibraryPinWrite = QueryLike & { previous?: QueryLike };

const isLibrary = (query: QueryLike): boolean => (query.kind ?? query.dataSource?.kind) === LIBRARY_KIND;
const optionsOf = (query: QueryLike): Record<string, unknown> => (query.options ?? {}) as Record<string, unknown>;

// Null when the row is not a library consumer.
const referenceOf = (query: QueryLike | undefined): { queryId: unknown; versionId: unknown } | null =>
  query && isLibrary(query)
    ? { queryId: optionsOf(query).libraryQueryId, versionId: optionsOf(query).libraryQueryVersionId }
    : null;

// A write sets or changes a reference when the row becomes a library consumer or its pinned query/version moves.
// A malformed reference counts too: there is nothing to carry along, so a user write must supply a real one.
const changesReference = (write: LibraryPinWrite): boolean => {
  const next = referenceOf(write);
  if (!next) return false;
  if (!isLibraryUuid(next.queryId) || !isLibraryUuid(next.versionId)) return true;
  const before = referenceOf(write.previous);
  return !before || before.queryId !== next.queryId || before.versionId !== next.versionId;
};

// Stable id order, so concurrent bulk writes cannot deadlock.
async function lockParents(
  manager: EntityManager,
  organizationId: string,
  mustExist: Set<string>,
  carried: string[]
): Promise<void> {
  for (const id of [...new Set([...mustExist, ...carried])].sort()) {
    if (mustExist.has(id)) await lockLibraryQuery(manager, id, organizationId);
    else await lockLibraryQueryIfExists(manager, id, organizationId);
  }
}

// Locks a library query of this workspace if it exists; null when it does not.
export async function lockLibraryQueryIfExists(
  manager: EntityManager,
  queryId: string,
  organizationId: string
): Promise<LibraryQuery | null> {
  const planned = importLocks.get(manager);
  if (planned && !planned.has(queryId))
    throw new ConflictException('Library queries changed during import. Retry the import.');
  await manager.query('SELECT id FROM library_queries WHERE id = $1 AND organization_id = $2 FOR UPDATE', [
    queryId,
    organizationId,
  ]);
  return manager.findOne(LibraryQuery, { where: { id: queryId, organizationId } });
}

// Hold this lock until the caller's transaction commits, including consumer persistence.
export async function lockLibraryQuery(
  manager: EntityManager,
  queryId: string,
  organizationId: string
): Promise<LibraryQuery> {
  const query = await lockLibraryQueryIfExists(manager, queryId, organizationId);
  if (!query) throw new NotFoundException('Library query not found');
  return query;
}

// True when some write sets or changes a library reference: only those need the licence.
export const setsLibraryReference = (writes: LibraryPinWrite[]): boolean => writes.some(changesReference);

// Locks the parent of every library consumer a user write touches. Only a reference being set or changed is checked
// (parent and snapshot must exist). An unchanged reference may point at a library query that is not in this
// workspace (imported, pulled from git, or deleted): it is locked only if it exists, and running it reports the
// missing query.
export async function lockLibraryPins(
  manager: EntityManager,
  organizationId: string,
  writes: LibraryPinWrite[]
): Promise<void> {
  const checked = writes.filter(changesReference).map((write) => {
    const options = optionsOf(write);
    if (!isLibraryUuid(options.libraryQueryId)) throw new BadRequestException('A library query ID is required');
    return { queryId: options.libraryQueryId, versionId: parseLibraryReference(options).id };
  });
  const carried = writes
    .filter((write) => !changesReference(write))
    .map((write) => referenceOf(write)?.queryId)
    .filter(isLibraryUuid);
  await lockParents(manager, organizationId, new Set(checked.map((pin) => pin.queryId)), carried);
  for (const pin of checked) await resolveLibraryReference(pin.queryId, pin.versionId, manager);
}

// For writes that copy references without changing them (version create, import, git pull): nothing is checked,
// whatever the reference holds is kept.
export async function lockCarriedLibraryPins(
  manager: EntityManager,
  organizationId: string,
  queries: QueryLike[]
): Promise<void> {
  const carried = queries.map((query) => referenceOf(query)?.queryId).filter(isLibraryUuid);
  await lockParents(manager, organizationId, new Set(), carried);
}

// False when the bundle being imported has no library content (no lock plan): its queries need no library locks.
export const importHasLibraryContent = (manager: EntityManager): boolean => importLocks.has(manager);

export function registerImportedLibraryQuery(manager: EntityManager, queryId: string): void {
  importLocks.get(manager)?.add(queryId);
}

// The parts of an exported app (or module) bundle the lock plan reads.
type ImportBundle = {
  appV2?: ImportBundle;
  libraryQueries?: unknown;
  dataQueries?: (QueryLike & { dataSourceId?: string })[];
  dataSources?: { id: string; kind: string }[];
  modules?: ImportBundle[];
};

// Call once before recursively importing modules, not after each child's writes.
// The current bundle's identity/reference fields are independent of snapshot format.
// Parents that are not in this workspace are planned but not locked: their references are carried as-is.
export async function withLibraryImportLocks<T>(
  manager: EntityManager,
  organizationId: string,
  bundle: unknown,
  isGitApp: boolean,
  operation: () => Promise<T>
): Promise<T> {
  if (importLocks.has(manager)) return operation();
  const apps: ImportBundle[] = [];
  const visited = new WeakSet<object>();
  const visit = (item: ImportBundle | undefined) => {
    const app = item?.appV2 ?? item;
    if (!app || typeof app !== 'object' || visited.has(app)) return;
    visited.add(app);
    apps.push(app);
    for (const child of app.modules ?? []) visit(child);
  };
  visit(bundle as ImportBundle);

  const parents = new Set<string>();
  const bundledOf = (app: ImportBundle): LibraryExportQuery[] => {
    if (isGitApp || app.libraryQueries === undefined) return [];
    if (!Array.isArray(app.libraryQueries)) throw new BadRequestException('Invalid named library query export');
    assertLibraryExport(app.libraryQueries);
    return app.libraryQueries;
  };
  const bundles = apps.map(bundledOf);
  const existing = bundles.some((bundled) => bundled.length)
    ? await manager.find(LibraryQuery, { where: { organizationId } })
    : [];
  apps.forEach((app, index) => {
    const claimed = new Set<string>();
    for (const incoming of bundles[index]) {
      const target = matchLibraryQuery(existing, incoming, claimed);
      if (target) {
        claimed.add(target.id);
        parents.add(target.id);
      }
    }
    // Every referenced id, bundled or not: an unlicensed import keeps the exporter's ids (locking a foreign id is a no-op).
    for (const query of app.dataQueries ?? []) {
      const source = (app.dataSources ?? []).find((source) => source.id === query.dataSourceId);
      if ((source?.kind ?? query.kind) !== LIBRARY_KIND) continue;
      const id = optionsOf(query).libraryQueryId;
      if (isLibraryUuid(id)) parents.add(id);
    }
  });
  // Most apps carry no library content: no plan, no locks.
  if (!parents.size && !bundles.some((bundled) => bundled.length)) return operation();

  for (const id of [...parents].sort()) await lockLibraryQueryIfExists(manager, id, organizationId);
  importLocks.set(manager, parents);
  try {
    return await operation();
  } finally {
    importLocks.delete(manager);
  }
}
