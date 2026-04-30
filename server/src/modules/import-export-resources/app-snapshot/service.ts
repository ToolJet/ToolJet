import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { DataSource } from '@entities/data_source.entity';
import { APP_TYPES } from '@modules/apps/constants';

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
 * Snapshot = the portable form. Same shape as AppData with `id` left at
 * the source instance's local DB id and `co_relation_id` carried alongside
 * as the stable cross-instance key. Instance-local fields (timestamps,
 * branch FKs, environment FKs, …) are stripped. Safe to write to a file
 * tree, send over the wire, or hand to another instance.
 *
 * The receiving end uses `co_relation_id` to either match an existing
 * local row (matchOrCreate) or generate a fresh local id (alwaysCreate),
 * then rewrites every UUID reference in the tree from source-local →
 * cor → target-local.
 */
export type Snapshot = Record<string, unknown>;

/**
 * Per-root-entity policy that drives import()'s decision when the
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

export interface ImportContext {
  /** Organization scope for cor_id lookups (apps, data sources are workspace-scoped). */
  organizationId: string;
}

export interface ImportOptions {
  manager: EntityManager;
  context: ImportContext;
  policy: ResourcePolicy;
  /**
   * Optional pre-existing cor → target-local map. Recursive imports
   * (e.g., `mapModulesForAppImport` in app-import-export which calls
   * `this.import()` for unmatched modules) pass the outer call's map
   * here so the same cor_id resolves to the same local id at every
   * nesting level. Mutated in-place; the caller observes the additions
   * after import() returns.
   */
  corToLocal?: Map<string, string>;
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

const UUID_V4_REGEX_GLOBAL = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g;

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
 * Export and import portable snapshots of an app.
 *
 * Every flow that crosses an instance boundary — git push, git pull,
 * JSON export, JSON import, branch-create — calls this service instead
 * of holding its own rewrite map. The shared boundary is what makes a
 * manual JSON export/import on instance B produce the same DB state as
 * a git push/pull from A to B.
 */
@Injectable()
export class AppSnapshot {
  // No constructor dependencies. The translator is a pure transformation
  // over the snapshot tree: export() = clone + strip; import() = chained
  // localToCor → corToLocal lookup with per-root-entity ResourcePolicy
  // applied via DB findOne. The earlier scaffolding included an
  // FkReferenceMap injectable for parent-scoped child matching; the regex
  // sweep handles every UUID reference (structural or embedded) via the
  // local→cor→local chain, and the FK catalogue ended up unused.

  /**
   * DB → wire. Clones the input tree and strips instance-local fields
   * that wouldn't make sense on another instance (timestamps, branch
   * FKs, environment FKs, pulledAt). The `id` field stays at the
   * source instance's local DB id; `co_relation_id` rides alongside as
   * the stable cross-instance key.
   *
   * Caller responsibility: every record in the tree must already have
   * a `co_relation_id` populated. Schema-level NOT NULL constraints
   * (apps, app_versions) make this easy; for tables where cor_id is
   * still nullable, the caller should backfill before exporting.
   */
  export(appData: AppData): Snapshot {
    const snapshot = clone(appData) as Snapshot;
    stripInstanceLocalFields(snapshot);
    return snapshot;
  }

  /**
   * Wire → DB. Walks the snapshot in dependency order. For each root
   * entity (apps, appVersions, modules, dataSources) the caller-supplied
   * `policy` decides whether to look up an existing row by
   * co_relation_id and reuse its local id, or always create a fresh
   * one. Child entities follow whichever path their parent took. Builds
   * a (source-local-id → target-local-id) translation by chaining
   * (source-local → cor) from the snapshot's records with (cor →
   * target-local) from the DB lookup, then sweeps every UUID string in
   * the tree. The caller is responsible for the actual INSERT/UPDATE.
   *
   * Caller responsibilities for fields stripped on export() (see
   * STRIP_FIELDS): branchId, currentEnvironmentId, createdBy,
   * parentVersionId, pulledAt — these are instance-local and the
   * snapshot intentionally drops them; the caller injects the right
   * values for its target instance/branch before persisting.
   */
  async import(snapshot: Snapshot, options: ImportOptions): Promise<AppData> {
    const { manager, context, policy } = options;
    const result = clone(snapshot) as AppData;

    // Source-local id → cor lookup, built from the records the snapshot
    // ships with. Every persisted row has both fields (schema-enforced
    // for apps + app_versions; the rest are caller-backfilled), so the
    // map covers every entity that could be referenced inside the tree.
    const localToCor = collectLocalToCor(result);

    // Cor → target-local lookup. matchOrCreate roots get DB-resolved
    // local ids; alwaysCreate roots and every child entity get a fresh
    // uuid. Apps and modules share the App table — type-filter so a
    // cor_id collision (e.g., a branched module's cor_id) can't be
    // reused as a FRONT_END app or vice versa.
    //
    // Caller may pass an existing map (recursive imports share it so
    // the same cor resolves to the same local id at every nesting
    // level); mutated in-place, no copy.
    const corToLocal = options.corToLocal ?? new Map<string, string>();
    await resolveAppRows(result, 'apps', APP_TYPES.FRONT_END, manager, context.organizationId, policy.apps, corToLocal);
    await resolveAppRows(
      result,
      'modules',
      APP_TYPES.MODULE,
      manager,
      context.organizationId,
      policy.modules,
      corToLocal
    );
    await resolveDataSources(result, manager, context.organizationId, policy.dataSources, corToLocal);
    await resolveAppVersions(result, manager, policy.appVersions, corToLocal, localToCor);
    assignFreshIdsToChildren(result, corToLocal);

    // Sweep every UUID string. Each lookup is local→cor→target-local;
    // either step may be a no-op (an embedded ref might already be a
    // cor_id rather than a local source id), and unrecognized UUIDs
    // pass through unchanged.
    //
    // The sweep tracks UUIDs that matched neither map — these are
    // either content-embedded UUIDs (legitimate, e.g. user-typed code
    // referencing a string that happens to look like a UUID) or
    // genuinely-orphan source-local ids (referential drift). We can't
    // distinguish the two without per-field type info, so we log a
    // sample for observability rather than fail.
    const unmappedSample = new Set<string>();
    rewriteUuidsInAllStrings(result, localToCor, corToLocal, unmappedSample);
    if (unmappedSample.size > 0) {
      const sample = Array.from(unmappedSample).slice(0, 10);
      logger.warn(
        `AppSnapshot.import: ${unmappedSample.size} UUID(s) passed through without translation ` +
          `(neither in localToCor nor corToLocal). Sample: ${sample.join(', ')}` +
          (unmappedSample.size > sample.length ? ` (+${unmappedSample.size - sample.length} more)` : '')
      );
    }

    return result;
  }
}

const logger = new Logger('AppSnapshot');

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

function rewriteUuidsInAllStrings(
  obj: unknown,
  localToCor: Map<string, string>,
  corToLocal: Map<string, string>,
  unmapped: Set<string>
): void {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const v = obj[i];
      if (typeof v === 'string') obj[i] = rewriteUuidsInString(v, localToCor, corToLocal, unmapped);
      else rewriteUuidsInAllStrings(v, localToCor, corToLocal, unmapped);
    }
    return;
  }
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    // slug is a URL identifier, not a UUID reference — never swap it.
    if (key === 'slug') continue;
    // co_relation_id rides through unchanged — it's the stable cor key,
    // not a reference to translate.
    if (key === 'co_relation_id') continue;
    const v = record[key];
    if (typeof v === 'string') record[key] = rewriteUuidsInString(v, localToCor, corToLocal, unmapped);
    else rewriteUuidsInAllStrings(v, localToCor, corToLocal, unmapped);
  }
}

function rewriteUuidsInString(
  value: string,
  localToCor: Map<string, string>,
  corToLocal: Map<string, string>,
  unmapped: Set<string>
): string {
  return value.replace(UUID_V4_REGEX_GLOBAL, (match) => {
    // Two-step lookup: source-local → cor → target-local. Either step
    // may miss; embedded refs are often cor_ids directly (skip step 1),
    // unknown UUIDs pass through (skip step 2).
    const cor = localToCor.get(match) ?? match;
    const target = corToLocal.get(cor);
    if (target !== undefined) return target;
    // Neither step produced a translation. Track for observability —
    // this is the "passes through unchanged" path that can mask
    // referential drift (a source-local id with no matching record on
    // the target). Caller decides what to do with the sample.
    unmapped.add(match);
    return match;
  });
}

function stripInstanceLocalFields(snapshot: Snapshot): void {
  for (const [folderName, content] of Object.entries(snapshot)) {
    const config = STRIP_FIELDS[folderName];
    if (!config) continue;
    const items = Array.isArray(content) ? content : content && typeof content === 'object' ? [content] : [];
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
    if (typeof item.co_relation_id === 'string') out.push(item.co_relation_id);
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
  corToLocal: Map<string, string>
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
  localToCor: Map<string, string>
): Promise<void> {
  const items = toArray(tree.versions);
  if (items.length === 0) return;

  // Versions are app-scoped (UNIQUE on (app_id, co_relation_id)), not
  // org-scoped — so we have to translate each version's parent appId
  // (a source-local id) through localToCor → corToLocal to get the
  // target-local id before we can scope the lookup.
  const localAppIds = new Set<string>();
  for (const v of items) {
    const sourceAppId = v.appId;
    if (typeof sourceAppId !== 'string') continue;
    const appCor = localToCor.get(sourceAppId);
    if (!appCor) continue;
    const targetAppId = corToLocal.get(appCor);
    if (targetAppId) localAppIds.add(targetAppId);
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
  corToLocal: Map<string, string>
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
      const cor = item.co_relation_id;
      if (typeof cor === 'string' && !corToLocal.has(cor)) {
        corToLocal.set(cor, uuid());
      }
    }
  }
  // Layouts live nested under each component; sweep them too.
  for (const component of toArray(tree.components)) {
    for (const layout of toArray(component.layouts)) {
      const cor = layout.co_relation_id;
      if (typeof cor === 'string' && !corToLocal.has(cor)) {
        corToLocal.set(cor, uuid());
      }
    }
  }
}

function indexByCorId(rows: { id: string; co_relation_id: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.co_relation_id) map.set(row.co_relation_id, row.id);
  }
  return map;
}
