import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { DataSource } from '@entities/data_source.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { FkReferenceMap } from './fk-reference-map';

const CHILD_FOLDERS = [
  'components',
  'pages',
  'queries',
  'events',
  'layouts',
  'dataQueryFolders',
  'dataQueryFolderMappings',
] as const;

/**
 * AppData = the in-memory shape used by export/import/git flows
 * (apps, components, pages, queries, …). Untyped here — nominal typing
 * for the whole legacy export tree is out of scope.
 */
export type AppData = Record<string, unknown>;

/**
 * Snapshot = the portable form. Local DB ids replaced with co_relation_ids,
 * instance-scoped fields stripped. Safe to write to a file tree, send
 * over the wire, or hand to another instance.
 */
export type Snapshot = Record<string, unknown>;

/**
 * Per-root-entity policy that drives restore()'s decision when the
 * snapshot mentions a co_relation_id that already exists locally:
 *
 * - 'matchOrCreate': look up the existing row by co_relation_id; reuse
 *   its local id. If no match, create a new row with a fresh local id
 *   (the snapshot's co_relation_id is preserved on the new row).
 * - 'alwaysCreate': skip the lookup; always create a new row with a
 *   fresh local id.
 *
 * Child entities (components, pages, queries, events, layouts) do not
 * carry a policy: their lookup is naturally scoped to the resolved
 * parent. New parent → no matches → new children. Matched parent →
 * scope-matched children get reused.
 */
export type Policy = 'matchOrCreate' | 'alwaysCreate';

export interface ResourcePolicy {
  apps: Policy;
  appVersions: Policy;
  modules: Policy;
  dataSources: Policy;
}

export interface RestoreContext {
  /** Organization scope for cor_id lookups (apps, data sources are workspace-scoped). */
  organizationId: string;
}

export interface RestoreOptions {
  manager: EntityManager;
  context: RestoreContext;
  policy: ResourcePolicy;
}

// Default policy for callers that want today's git-pull semantics: match
// existing rows by cor_id where possible, create where not.
export const GIT_PULL_POLICY: ResourcePolicy = {
  apps: 'matchOrCreate',
  appVersions: 'matchOrCreate',
  modules: 'matchOrCreate',
  dataSources: 'matchOrCreate',
};

// Default policy for JSON-bundle import: always create a fresh app and
// versions (so re-uploading a bundle produces a duplicate, not an
// overwrite); link to existing workspace resources by cor_id.
export const JSON_IMPORT_POLICY: ResourcePolicy = {
  apps: 'alwaysCreate',
  appVersions: 'alwaysCreate',
  modules: 'matchOrCreate',
  dataSources: 'matchOrCreate',
};

const UUID_V4_REGEX_GLOBAL =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g;

/**
 * Per-folder fields that exist locally but must not appear in a snapshot:
 * timestamps that drift across instances, FK columns to instance-scoped
 * tables (workspace_branch, environment, user), and bookkeeping fields
 * like pulledAt.
 */
const STRIP_FIELDS: Record<string, { fields?: string[]; nested?: Record<string, { fields: string[] }> }> = {
  versions: {
    fields: ['parentVersionId', 'createdBy', 'currentEnvironmentId', 'branchId', 'pulledAt'],
  },
  components: {
    nested: { layouts: { fields: ['updatedAt'] } },
  },
  queries: {
    nested: { options: { fields: ['organization_id'] } },
  },
  dataQueryFolders: { fields: ['createdAt', 'updatedAt'] },
  dataQueryFolderMappings: { fields: ['createdAt', 'updatedAt'] },
};

/**
 * Take and restore portable snapshots of an app.
 *
 * Every flow that crosses an instance boundary — git push, git pull,
 * JSON export, JSON import, branch-create — calls this service instead
 * of holding its own rewrite map. The shared boundary is what makes a
 * manual JSON export/import on instance B produce the same DB state as
 * a git push/pull from A to B.
 */
@Injectable()
export class AppSnapshot {
  // FkReferenceMap is needed by restore() (lookup-by-cor-id requires
  // knowing which fields are FKs and their target tables). take() doesn't
  // need it — the regex sweep handles every UUID, structural or not.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly fkMap: FkReferenceMap) {}

  /**
   * DB → wire. Walks the input tree, replaces every local-id reference
   * with its co_relation_id, strips instance-local fields. The result
   * is safe to persist outside this instance.
   *
   * The input must contain every entity referenced by an FK in the tree.
   * If a query references a workspace-scoped data source, that data
   * source row needs to be in the AppData (with its co_relation_id) for
   * the FK rewrite to find a mapping.
   */
  take(appData: AppData): Snapshot {
    const snapshot = clone(appData) as Snapshot;
    const localToCor = collectLocalToCor(snapshot);
    swapIdToCorRecursive(snapshot);
    rewriteUuidsInAllStrings(snapshot, localToCor);
    stripInstanceLocalFields(snapshot);
    return snapshot;
  }

  /**
   * Wire → DB. Walks the snapshot in dependency order. For each root
   * entity (apps, appVersions, modules, dataSources) the caller-supplied
   * `policy` decides whether to look up an existing row by
   * co_relation_id and reuse its local id, or always create a fresh
   * one. Child entities follow whichever path their parent took. Builds
   * a cor_id → local_id map as it goes, rewrites every reference to
   * the resolved local id, returns the resolved tree. The caller is
   * responsible for the actual INSERT/UPDATE.
   *
   * Caller responsibilities for fields stripped on take() (see
   * STRIP_FIELDS): branchId, currentEnvironmentId, createdBy,
   * parentVersionId, pulledAt — these are instance-local and the snapshot
   * intentionally drops them; the caller has to inject the right values
   * for its target instance/branch before persisting.
   */
  async restore(snapshot: Snapshot, options: RestoreOptions): Promise<AppData> {
    const { manager, context, policy } = options;
    const result = clone(snapshot) as AppData;
    const corToLocal = new Map<string, string>();

    // Roots first: their resolved local ids feed downstream lookups (versions
    // are app-scoped, queries reference app-scoped data sources, …). Apps
    // and modules share the App table; the type filter prevents a cor_id
    // collision (e.g., a branched module's cor_id) from being reused as a
    // FRONT_END app, or vice versa.
    await resolveAppRows(result, 'apps', APP_TYPES.FRONT_END, manager, context.organizationId, policy.apps, corToLocal);
    await resolveAppRows(result, 'modules', APP_TYPES.MODULE, manager, context.organizationId, policy.modules, corToLocal);
    await resolveDataSources(result, manager, context.organizationId, policy.dataSources, corToLocal);
    await resolveAppVersions(result, manager, policy.appVersions, corToLocal);

    // Children always get fresh local ids in V1. Parent-scoped match-by-cor_id
    // (so a matched app reuses its existing component rows) is a follow-up;
    // today's import flow creates fresh children too, so this preserves parity.
    assignFreshIdsToChildren(result, corToLocal);

    // Two-step rewrite: first put the local id back on each record (and
    // restore co_relation_id), then sweep all strings for any other UUIDs
    // that point at a known cor_id (FK columns, embedded refs in JSON,
    // template strings).
    applyResolutionToRecords(result, corToLocal);
    rewriteUuidsInAllStrings(result, corToLocal);

    return result;
  }
}

// ---------- pure helpers (no `this`, easy to unit-test in isolation) ----------

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function collectLocalToCor(tree: unknown): Map<string, string> {
  const out = new Map<string, string>();
  visit(tree, (record) => {
    const id = record.id;
    const cor = record.co_relation_id;
    if (typeof id === 'string' && typeof cor === 'string') out.set(id, cor);
  });
  return out;
}

function swapIdToCorRecursive(tree: unknown): void {
  visit(tree, (record) => {
    if (typeof record.id === 'string' && typeof record.co_relation_id === 'string') {
      record.id = record.co_relation_id;
      delete record.co_relation_id;
    }
  });
}

function rewriteUuidsInAllStrings(obj: unknown, localToCor: Map<string, string>): void {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const v = obj[i];
      if (typeof v === 'string') obj[i] = rewriteUuidsInString(v, localToCor);
      else rewriteUuidsInAllStrings(v, localToCor);
    }
    return;
  }
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    // slug is a URL identifier, not a UUID reference — never swap it.
    if (key === 'slug') continue;
    // co_relation_id is the portable id we just stored; rewriting it would
    // collapse it back to the local id we're trying to associate with it.
    if (key === 'co_relation_id') continue;
    const v = record[key];
    if (typeof v === 'string') record[key] = rewriteUuidsInString(v, localToCor);
    else rewriteUuidsInAllStrings(v, localToCor);
  }
}

function rewriteUuidsInString(value: string, localToCor: Map<string, string>): string {
  return value.replace(UUID_V4_REGEX_GLOBAL, (uuid) => localToCor.get(uuid) ?? uuid);
}

function stripInstanceLocalFields(snapshot: Snapshot): void {
  for (const [folderName, content] of Object.entries(snapshot)) {
    const config = STRIP_FIELDS[folderName];
    if (!config) continue;
    const items = Array.isArray(content)
      ? content
      : content && typeof content === 'object'
      ? [content]
      : [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      for (const f of config.fields ?? []) delete record[f];
      if (!config.nested) continue;
      for (const [key, nestedConfig] of Object.entries(config.nested)) {
        const nested = record[key];
        if (Array.isArray(nested)) {
          for (const child of nested) {
            if (child && typeof child === 'object') {
              for (const f of nestedConfig.fields) delete (child as Record<string, unknown>)[f];
            }
          }
        } else if (nested && typeof nested === 'object') {
          for (const f of nestedConfig.fields) delete (nested as Record<string, unknown>)[f];
        }
      }
    }
  }
}

function visit(node: unknown, fn: (record: Record<string, unknown>) => void): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const v of node) visit(v, fn);
    return;
  }
  const record = node as Record<string, unknown>;
  fn(record);
  for (const v of Object.values(record)) visit(v, fn);
}

function toArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (value && typeof value === 'object') return [value as Record<string, unknown>];
  return [];
}

function collectCorIds(items: Record<string, unknown>[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (typeof item.id === 'string') out.push(item.id);
  }
  return out;
}

async function resolveAppRows(
  tree: AppData,
  folder: 'apps' | 'modules',
  type: APP_TYPES,
  manager: EntityManager,
  organizationId: string,
  policy: Policy,
  corToLocal: Map<string, string>,
): Promise<void> {
  const items = toArray(tree[folder]);
  if (items.length === 0) return;

  const corIds = collectCorIds(items);
  const existing =
    policy === 'matchOrCreate' && corIds.length > 0
      ? await manager.find(App, { where: { co_relation_id: In(corIds), organizationId, type } })
      : [];
  const existingByCor = indexByCorId(existing);

  for (const corId of corIds) {
    if (corToLocal.has(corId)) continue;
    corToLocal.set(corId, existingByCor.get(corId) ?? uuid());
  }
}

async function resolveAppVersions(
  tree: AppData,
  manager: EntityManager,
  policy: Policy,
  corToLocal: Map<string, string>,
): Promise<void> {
  const items = toArray(tree.versions);
  if (items.length === 0) return;

  // Versions are app-scoped (UNIQUE on (app_id, co_relation_id)), not
  // org-scoped — so we have to translate each version's parent appId from
  // its cor_id to the local id resolved by resolveAppRows before we can
  // scope the lookup.
  const localAppIds = new Set<string>();
  for (const v of items) {
    const appCorId = v.appId;
    if (typeof appCorId === 'string') {
      const localAppId = corToLocal.get(appCorId);
      if (localAppId) localAppIds.add(localAppId);
    }
  }

  const corIds = collectCorIds(items);
  const existing =
    policy === 'matchOrCreate' && corIds.length > 0 && localAppIds.size > 0
      ? await manager.find(AppVersion, {
          where: { co_relation_id: In(corIds), appId: In([...localAppIds]) },
        })
      : [];
  const existingByCor = indexByCorId(existing);

  for (const corId of corIds) {
    if (corToLocal.has(corId)) continue;
    corToLocal.set(corId, existingByCor.get(corId) ?? uuid());
  }
}

async function resolveDataSources(
  tree: AppData,
  manager: EntityManager,
  organizationId: string,
  policy: Policy,
  corToLocal: Map<string, string>,
): Promise<void> {
  const items = toArray(tree.dataSources);
  if (items.length === 0) return;

  const corIds = collectCorIds(items);
  const existing =
    policy === 'matchOrCreate' && corIds.length > 0
      ? await manager.find(DataSource, { where: { co_relation_id: In(corIds), organizationId } })
      : [];
  const existingByCor = indexByCorId(existing);

  for (const corId of corIds) {
    if (corToLocal.has(corId)) continue;
    corToLocal.set(corId, existingByCor.get(corId) ?? uuid());
  }
}

function assignFreshIdsToChildren(tree: AppData, corToLocal: Map<string, string>): void {
  for (const folder of CHILD_FOLDERS) {
    for (const item of toArray(tree[folder])) {
      if (typeof item.id === 'string' && !corToLocal.has(item.id)) {
        corToLocal.set(item.id, uuid());
      }
    }
  }
  // Layouts live nested under each component; sweep them too.
  for (const component of toArray(tree.components)) {
    for (const layout of toArray(component.layouts)) {
      if (typeof layout.id === 'string' && !corToLocal.has(layout.id)) {
        corToLocal.set(layout.id, uuid());
      }
    }
  }
}

function applyResolutionToRecords(tree: unknown, corToLocal: Map<string, string>): void {
  visit(tree, (record) => {
    const id = record.id;
    if (typeof id !== 'string' || !corToLocal.has(id)) return;
    // Preserve any pre-existing co_relation_id rather than clobbering it
    // with the value of `id`. take()-produced snapshots delete the field
    // before this runs so the assignment branch fires; non-take() inputs
    // (e.g., a JSON bundle that already has both fields) keep their
    // canonical cor_id intact.
    if (typeof record.co_relation_id !== 'string') {
      record.co_relation_id = id;
    }
    record.id = corToLocal.get(id);
  });
}

function indexByCorId(rows: { id: string; co_relation_id: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.co_relation_id) map.set(row.co_relation_id, row.id);
  }
  return map;
}
