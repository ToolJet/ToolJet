import { EntityManager, In } from 'typeorm';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { DataSourceScopes } from '@modules/data-sources/constants';
import { isLibraryUuid, isSameLibrarySnapshot, LIBRARY_DRAFT, parseLibraryVersionRef } from './library-query.util';

// What an app export carries for the library queries it uses.
export type LibraryExportSnapshot = { kind: string; dataSourceId: string | null; options: Record<string, unknown> };
export type LibraryExportVersion = LibraryExportSnapshot & { id: string; versionNumber: number };
export type LibraryExportQuery = {
  id: string;
  coRelationId: string | null;
  name: string;
  folder: string | null;
  draft: LibraryExportSnapshot;
  versions: LibraryExportVersion[];
};

type DraftRow = {
  id: string;
  co_relation_id: string | null;
  name: string;
  data_source_id: string | null;
  options: unknown;
  kind: string;
};
type VersionRow = {
  id: string;
  library_query_id: string;
  version_number: number;
  kind: string;
  data_source_id: string | null;
  options: unknown;
};
type Entry = { draft: DraftRow; versions: Map<string, VersionRow> };

// data_queries.options is simple-json (text); library_query_versions.options is jsonb.
function toOptions(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return (JSON.parse(value) as Record<string, unknown>) ?? {};
    } catch {
      return {};
    }
  }
  return (value as Record<string, unknown>) ?? {};
}

// A malformed pin reads as draft, like the rest of the library code; the export must not fail on it.
function pinnedVersionId(ref: unknown): string | null {
  try {
    const parsed = parseLibraryVersionRef(ref);
    return parsed.draft ? null : parsed.versionId;
  } catch {
    return null;
  }
}

// Library drafts are workspace-owned, including drafts whose data source was deleted.
const DRAFT_SELECT = `SELECT dq.id, dq.co_relation_id, dq.name, dq.data_source_id, dq.options, dq.kind
       FROM library_queries dq
      WHERE dq.organization_id = $2`;

const VERSION_COLUMNS = 'id, library_query_id, version_number, kind, data_source_id, options';

const toSnapshotRow = (row: DraftRow | VersionRow) => ({ kind: row.kind, options: toOptions(row.options) });

export async function collectLibraryExport(
  manager: EntityManager,
  organizationId: string,
  consumers: DataQuery[]
): Promise<LibraryExportQuery[]> {
  const queryIds = new Set<string>();
  const versionIds = new Set<string>();
  for (const consumer of consumers) {
    const options = toOptions(consumer.options);
    if (!isLibraryUuid(options.libraryQueryId)) continue;
    queryIds.add(options.libraryQueryId);
    const versionId = pinnedVersionId(options.libraryQueryVersionId);
    if (versionId) versionIds.add(versionId);
  }
  if (!queryIds.size) return [];

  const entries = new Map<string, Entry>();
  for (const row of (await manager.query(`${DRAFT_SELECT} AND dq.id = ANY($1::uuid[])`, [
    [...queryIds],
    organizationId,
  ])) as DraftRow[]) {
    entries.set(row.id, { draft: row, versions: new Map() });
  }

  const attach = (rows: VersionRow[]) => {
    for (const row of rows) entries.get(row.library_query_id)?.versions.set(row.id, row);
  };

  if (entries.size && versionIds.size) {
    attach(
      await manager.query(
        `SELECT ${VERSION_COLUMNS} FROM library_query_versions WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
        [[...versionIds]]
      )
    );
  }

  // Nested folders: the mapping's parent is always the immediate folder.
  const folderRows: { queryId: string; folder: string }[] = entries.size
    ? await manager.query(
        `SELECT q.id AS "queryId", f.name AS "folder"
           FROM library_queries q
           JOIN library_query_folders f ON f.id = q.folder_id AND f.organization_id = q.organization_id
          WHERE q.id = ANY($1::uuid[])`,
        [[...entries.keys()]]
      )
    : [];
  const folderByQueryId = new Map(folderRows.map((row) => [row.queryId, row.folder]));

  return [...entries.values()]
    .map(
      ({ draft, versions }): LibraryExportQuery => ({
        id: draft.id,
        coRelationId: draft.co_relation_id ?? null,
        name: draft.name,
        folder: folderByQueryId.get(draft.id) ?? null,
        draft: { ...toSnapshotRow(draft), dataSourceId: draft.data_source_id ?? null },
        versions: [...versions.values()]
          .sort((a, b) => a.version_number - b.version_number)
          .map((row) => ({
            id: row.id,
            versionNumber: row.version_number,
            ...toSnapshotRow(row),
            dataSourceId: row.data_source_id ?? null,
          })),
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

const snapshotsOf = (queries: LibraryExportQuery[]): LibraryExportSnapshot[] =>
  queries.flatMap((query) => [query.draft, ...query.versions]);

export const libraryDataSourceIds = (queries: LibraryExportQuery[]): string[] => [
  ...new Set(snapshotsOf(queries).flatMap((snapshot) => (snapshot.dataSourceId ? [snapshot.dataSourceId] : []))),
];

// Same places the app's own ToolJet DB queries keep table ids (AppsUtilService.findTooljetDbTables).
export function libraryTooljetDbTableIds(queries: LibraryExportQuery[]): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === 'string' && value) ids.add(value);
  };
  type Field = { table?: unknown } | undefined;
  type Join = { table?: unknown; conditions?: { conditionsList?: { leftField?: Field; rightField?: Field }[] } };
  for (const { kind, options } of snapshotsOf(queries)) {
    if (kind !== 'tooljetdb') continue;
    add(options.table_id);
    if (options.operation !== 'join_tables') continue;
    const joinTable = options.join_table as { from?: { name?: unknown }; joins?: Join[] } | undefined;
    add(joinTable?.from?.name);
    for (const join of joinTable?.joins ?? []) {
      add(join.table);
      for (const condition of join.conditions?.conditionsList ?? []) {
        add(condition.leftField?.table);
        add(condition.rightField?.table);
      }
    }
  }
  return [...ids];
}

// Rewrites the table ids of every ToolJet DB snapshot in place. The export carries a table under its portable id
// (co_relation_id, minted on first export) and import maps tables by that id, so snapshots must use it too.
export function remapLibraryTooljetDbTables(
  queries: LibraryExportQuery[],
  remap: (options: Record<string, unknown>) => Record<string, unknown>
): void {
  for (const snapshot of snapshotsOf(queries)) {
    if (snapshot.kind === 'tooljetdb') snapshot.options = remap(snapshot.options);
  }
}

// The data sources the snapshots point at. Only this workspace's global ones travel (workspace and static
// data sources); import maps them like the app's own.
export async function findLibraryExportDataSources(
  manager: EntityManager,
  organizationId: string,
  queries: LibraryExportQuery[]
): Promise<DataSource[]> {
  const ids = libraryDataSourceIds(queries);
  if (!ids.length) return [];
  return manager.find(DataSource, { where: { id: In(ids), organizationId, scope: DataSourceScopes.GLOBAL } });
}

// ---- Import ----
// Pure matching and mapping rules; AppImportExportService.importLibraryQueries only loads and writes.

// Same strict order as Modules: the portable co_relation_id (the exporter's own id when it has none), then the
// exporter's id (re-importing into the workspace the export came from finds the original), then the name.
// `taken` holds local rows another incoming query already claimed, so two incoming queries never share a row.
export function matchLibraryQuery<
  Q extends { id: string; co_relation_id?: string | null; coRelationId?: string | null; name: string },
>(
  existing: Q[],
  incoming: Pick<LibraryExportQuery, 'id' | 'coRelationId' | 'name'>,
  taken: ReadonlySet<string> = new Set()
): Q | null {
  const free = existing.filter((query) => !taken.has(query.id));
  const key = incoming.coRelationId ?? incoming.id;
  return (
    free.find((query) => (query.coRelationId ?? query.co_relation_id) === key) ??
    free.find((query) => query.id === incoming.id) ??
    free.find((query) => query.name === incoming.name) ??
    null
  );
}

// `incoming` is already mapped to this workspace. A soft-deleted row never matches.
export function matchLibraryVersion(
  existing: LibraryQueryVersion[],
  incoming: LibraryExportSnapshot
): LibraryQueryVersion | null {
  return existing.find((version) => !version.deletedAt && isSameLibrarySnapshot(version, incoming)) ?? null;
}

// A snapshot's data source is exported only when it is a global one, so an id that maps to nothing becomes null.
// ToolJet DB table ids are remapped with the app's own remapper; an unmapped table id stays as it was.
export function mapLibrarySnapshot<T extends LibraryExportSnapshot>(
  snapshot: T,
  dataSourceMapping: Record<string, string>,
  remapTooljetDbOptions: (options: Record<string, unknown>) => Record<string, unknown>
): T {
  const dataSourceId = snapshot.dataSourceId ? (dataSourceMapping[snapshot.dataSourceId] ?? null) : null;
  if (snapshot.kind !== 'tooljetdb') return { ...snapshot, dataSourceId };
  const remapped = remapTooljetDbOptions(snapshot.options);
  const options =
    snapshot.options.table_id !== undefined && remapped.table_id === undefined
      ? { ...remapped, table_id: snapshot.options.table_id }
      : remapped;
  return { ...snapshot, dataSourceId, options };
}

// New `options` for a consumer query, or null when its pins already point at the right rows. 'draft' and ids
// the maps don't know stay as they are; that run fails readably.
export function remapLibraryConsumerOptions(
  options: Record<string, unknown>,
  queryMap: Record<string, string>,
  versionMap: Record<string, string>
): Record<string, unknown> | null {
  const queryId = options.libraryQueryId;
  const versionId = options.libraryQueryVersionId;
  const nextQueryId = typeof queryId === 'string' ? (queryMap[queryId] ?? queryId) : queryId;
  const nextVersionId =
    typeof versionId === 'string' && versionId !== LIBRARY_DRAFT ? (versionMap[versionId] ?? versionId) : versionId;
  if (nextQueryId === queryId && nextVersionId === versionId) return null;
  return { ...options, libraryQueryId: nextQueryId, libraryQueryVersionId: nextVersionId };
}
