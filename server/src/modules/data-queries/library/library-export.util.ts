import { BadRequestException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { DataSourceScopes } from '@modules/data-sources/constants';
import { tableNamesInSqlQuery } from '@helpers/tooljet_db.helper';
import { assertSupportedLibraryKind, isLibraryUuid, parseLibraryReference } from './library-query.util';

export type LibraryExportSnapshot = { kind: string; dataSourceId: string | null; options: Record<string, unknown> };
export type LibraryExportDraft = LibraryExportSnapshot & {
  id: string;
  name: string;
  description: string | null;
  createdFromVersionId: string | null;
};
export type LibraryExportVersion = LibraryExportDraft & {
  versionNumber: number;
  environment: { name: string; priority: number } | null;
};
export type LibraryExportQuery = {
  id: string;
  coRelationId: string | null;
  name: string;
  folder: string | null;
  releasedVersionId: string | null;
  drafts: LibraryExportDraft[];
  versions: LibraryExportVersion[];
};

// A single new format: no generated names, implicit drafts, foreign parent links or duplicate identities.
export function assertLibraryExport(queries: LibraryExportQuery[]): void {
  const queryIds = new Set<string>();
  const snapshotIds = new Set<string>();
  const invalid = () => {
    throw new BadRequestException('Invalid named library query export');
  };
  const nullableId = (value: unknown) => value === null || isLibraryUuid(value);
  for (const query of queries) {
    if (
      !query ||
      !isLibraryUuid(query.id) ||
      queryIds.has(query.id) ||
      !nullableId(query.coRelationId) ||
      typeof query.name !== 'string' ||
      !query.name.trim() ||
      query.name.length > 255 ||
      !(query.folder === null || (typeof query.folder === 'string' && !!query.folder.trim())) ||
      !Array.isArray(query.drafts) ||
      !Array.isArray(query.versions) ||
      'draft' in query ||
      !nullableId(query.releasedVersionId) ||
      !(query.drafts.length + query.versions.length)
    )
      invalid();
    queryIds.add(query.id);
    const names = new Set<string>();
    const versionIds = new Set(query.versions.map((version) => version?.id));
    const numbers = new Set<number>();
    for (const snapshot of [...query.drafts, ...query.versions]) {
      if (
        !snapshot ||
        !isLibraryUuid(snapshot.id) ||
        snapshotIds.has(snapshot.id) ||
        typeof snapshot.name !== 'string' ||
        !/^[^\s~^:?*[\]\\@{]+$/.test(snapshot.name) ||
        snapshot.name.length > 25 ||
        names.has(snapshot.name) ||
        !(
          snapshot.description === null ||
          (typeof snapshot.description === 'string' && snapshot.description.length <= 500)
        ) ||
        !nullableId(snapshot.createdFromVersionId) ||
        (snapshot.createdFromVersionId !== null && !versionIds.has(snapshot.createdFromVersionId)) ||
        !nullableId(snapshot.dataSourceId) ||
        typeof snapshot.kind !== 'string' ||
        !snapshot.options ||
        typeof snapshot.options !== 'object' ||
        Array.isArray(snapshot.options)
      )
        invalid();
      assertSupportedLibraryKind(snapshot.kind);
      snapshotIds.add(snapshot.id);
      names.add(snapshot.name);
    }
    for (const version of query.versions) {
      if (
        !Number.isInteger(version.versionNumber) ||
        version.versionNumber < 1 ||
        numbers.has(version.versionNumber) ||
        !(
          version.environment === null ||
          (version.environment &&
            typeof version.environment.name === 'string' &&
            !!version.environment.name &&
            Number.isInteger(version.environment.priority) &&
            version.environment.priority > 0)
        )
      )
        invalid();
      numbers.add(version.versionNumber);
      const visited = new Set<string>([version.id]);
      let parent = version.createdFromVersionId;
      while (parent) {
        if (visited.has(parent)) invalid();
        visited.add(parent);
        parent = query.versions.find((row) => row.id === parent)?.createdFromVersionId;
      }
    }
    if (query.releasedVersionId !== null && !versionIds.has(query.releasedVersionId)) invalid();
  }
}

export async function collectLibraryExport(
  manager: EntityManager,
  organizationId: string,
  consumers: DataQuery[]
): Promise<LibraryExportQuery[]> {
  // A reference that is malformed or names a deleted query/version is exported as-is with nothing bundled for it,
  // like import and git pull carry it: running it reports the missing query, release/promote refuse it.
  const pins = consumers
    .map((consumer) => ({
      queryId: consumer.options?.libraryQueryId,
      id: consumer.options?.libraryQueryVersionId,
    }))
    .filter((pin): pin is { queryId: string; id: string } => isLibraryUuid(pin.queryId) && isLibraryUuid(pin.id));
  if (!pins.length) return [];
  const queries = await manager.find(LibraryQuery, {
    where: { organizationId, id: In(pins.map((pin) => pin.queryId)) },
  });
  const ids = queries.map((query) => query.id);
  if (!ids.length) return [];
  const [drafts, versions, states, folders, environments] = await Promise.all([
    manager.find(LibraryQueryDraft, { where: { libraryQueryId: In(ids) } }),
    manager.find(LibraryQueryVersion, { where: { libraryQueryId: In(ids) } }),
    manager.find(LibraryQueryState, { where: { libraryQueryId: In(ids) } }),
    manager.find(LibraryQueryFolder, { where: { organizationId } }),
    manager.find(AppEnvironment, { where: { organizationId } }),
  ]);
  const result = queries
    .map((query): LibraryExportQuery => {
      const ownVersions = versions.filter((row) => row.libraryQueryId === query.id);
      const ownDrafts = drafts.filter((row) => row.libraryQueryId === query.id);
      const releasedVersionId = states.find((state) => state.libraryQueryId === query.id)?.releasedVersionId ?? null;
      const selected = new Set(pins.filter((pin) => pin.queryId === query.id).map((pin) => pin.id));
      if (releasedVersionId) selected.add(releasedVersionId);
      const include = (id: string) => {
        const row = ownVersions.find((row) => row.id === id) ?? ownDrafts.find((row) => row.id === id);
        if (!row) return;
        if (
          row.createdFromVersionId &&
          ownVersions.some((parent) => parent.id === row.createdFromVersionId) &&
          !selected.has(row.createdFromVersionId)
        ) {
          selected.add(row.createdFromVersionId);
          include(row.createdFromVersionId);
        }
      };
      for (const id of selected) include(id);
      const snapshot = (row: LibraryQueryDraft | LibraryQueryVersion): LibraryExportDraft => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdFromVersionId: ownVersions.some((parent) => parent.id === row.createdFromVersionId)
          ? row.createdFromVersionId
          : null,
        kind: row.kind,
        dataSourceId: row.dataSourceId,
        options: row.options,
      });
      return {
        id: query.id,
        coRelationId: query.coRelationId,
        name: query.name,
        folder: folders.find((folder) => folder.id === query.folderId)?.name ?? null,
        releasedVersionId,
        drafts: ownDrafts
          .filter((row) => selected.has(row.id) && !ownVersions.some((saved) => saved.id === row.id))
          .map(snapshot),
        versions: ownVersions
          .filter((row) => selected.has(row.id))
          .sort((a, b) => a.versionNumber - b.versionNumber)
          .map((row) => {
            const environment = environments.find((env) => env.id === row.currentEnvironmentId);
            return {
              ...snapshot(row),
              versionNumber: row.versionNumber,
              environment: environment ? { name: environment.name, priority: environment.priority } : null,
            };
          }),
      };
    })
    // Only deleted snapshots were referenced: nothing to bundle for this query.
    .filter((query) => query.drafts.length + query.versions.length)
    .sort((a, b) => a.name.localeCompare(b.name));
  assertLibraryExport(result);
  return result;
}

const snapshotsOf = (queries: LibraryExportQuery[]): LibraryExportSnapshot[] =>
  queries.flatMap((query) => [...query.drafts, ...query.versions]);

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

// Tables SQL-mode ToolJet DB snapshots name in their SQL text (they carry no table id).
export const libraryTooljetDbTableNames = (queries: LibraryExportQuery[]): string[] => [
  ...new Set(
    snapshotsOf(queries).flatMap(({ kind, options }) => (kind === 'tooljetdb' ? tableNamesInSqlQuery(options) : []))
  ),
];

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

// Retained local UUIDs are validated with the final remapped pins by the import caller.
export function remapLibraryConsumerOptions(
  options: Record<string, unknown>,
  queryMap: Record<string, string>,
  versionMap: Record<string, string>
): Record<string, unknown> | null {
  if (!isLibraryUuid(options.libraryQueryId)) throw new BadRequestException('A library query ID is required');
  const queryId = options.libraryQueryId;
  const versionId = parseLibraryReference(options).id;
  if (queryMap[queryId] && !versionMap[versionId])
    throw new BadRequestException('The bundled library snapshot is missing');
  const nextQueryId = typeof queryId === 'string' ? (queryMap[queryId] ?? queryId) : queryId;
  const nextVersionId = versionMap[versionId] ?? versionId;
  if (nextQueryId === queryId && nextVersionId === versionId) return null;
  return { ...options, libraryQueryId: nextQueryId, libraryQueryVersionId: nextVersionId };
}

// Library queries bundled anywhere in an app export (the app and its nested modules). Malformed lists are skipped:
// the import itself rejects them.
export function bundledLibraryQueries(bundle: unknown): LibraryExportQuery[] {
  const found: LibraryExportQuery[] = [];
  const visited = new WeakSet<object>();
  const visit = (item: unknown) => {
    const node = item as { appV2?: unknown; libraryQueries?: unknown; modules?: unknown } | null;
    const app = (node?.appV2 ?? node) as typeof node;
    if (!app || typeof app !== 'object' || visited.has(app)) return;
    visited.add(app);
    if (Array.isArray(app.libraryQueries)) found.push(...app.libraryQueries);
    if (Array.isArray(app.modules)) app.modules.forEach(visit);
  };
  visit(bundle);
  return found;
}
