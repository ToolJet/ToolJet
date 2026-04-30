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

export type AppData = Record<string, unknown>;
export type Snapshot = Record<string, unknown>;

export type Policy = 'matchOrCreate' | 'alwaysCreate';

export interface ResourcePolicy {
  apps: Policy;
  appVersions: Policy;
  modules: Policy;
  dataSources: Policy;
}

export interface ImportContext {
  organizationId: string;
}

export interface ImportOptions {
  manager: EntityManager;
  context: ImportContext;
  policy: ResourcePolicy;
  /** Recursive imports share this map so the same cor resolves to the same local id at every nesting level. */
  targetIdByCor?: Map<string, string>;
}

export const GIT_PULL_POLICY: ResourcePolicy = {
  apps: 'matchOrCreate',
  appVersions: 'matchOrCreate',
  modules: 'matchOrCreate',
  dataSources: 'matchOrCreate',
};

// Re-uploading a JSON bundle creates a new app rather than overwriting; linked workspace resources are reused.
export const JSON_IMPORT_POLICY: ResourcePolicy = {
  apps: 'alwaysCreate',
  appVersions: 'alwaysCreate',
  modules: 'matchOrCreate',
  dataSources: 'matchOrCreate',
};

const UUID_V4_REGEX_GLOBAL = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g;

// Instance-local fields the snapshot must not carry across instances.
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
 * Single boundary translator for cor_id ↔ local-id. Every flow that crosses
 * an instance boundary (git push/pull, JSON export/import, branch-create)
 * goes through this. JSON export/import on instance B must produce the same
 * DB state as a git push/pull A→B — that equivalence is what this enforces.
 */
@Injectable()
export class AppSnapshot {
  export(appData: AppData): Snapshot {
    const snapshot = clone(appData) as Snapshot;
    stripInstanceLocalFields(snapshot);
    return snapshot;
  }

  async import(snapshot: Snapshot, options: ImportOptions): Promise<AppData> {
    const { manager, context, policy } = options;
    const result = clone(snapshot) as AppData;

    const corBySourceId = collectCorBySourceId(result);
    const targetIdByCor = options.targetIdByCor ?? new Map<string, string>();

    // Apps and modules share the App table — type-filter so a cor_id collision
    // can't reuse a FRONT_END row as a MODULE or vice versa.
    await resolveAppRows(
      result,
      'apps',
      APP_TYPES.FRONT_END,
      manager,
      context.organizationId,
      policy.apps,
      targetIdByCor
    );
    await resolveAppRows(
      result,
      'modules',
      APP_TYPES.MODULE,
      manager,
      context.organizationId,
      policy.modules,
      targetIdByCor
    );
    await resolveDataSources(result, manager, context.organizationId, policy.dataSources, targetIdByCor);
    await resolveAppVersions(result, manager, policy.appVersions, targetIdByCor, corBySourceId);
    assignFreshIdsToChildren(result, targetIdByCor);

    const unmapped = new Set<string>();
    rewriteUuidsInAllStrings(result, corBySourceId, targetIdByCor, unmapped);
    if (unmapped.size > 0) {
      // Could be content-embedded UUIDs (user-typed strings that happen to look
      // like UUIDs) OR genuine referential drift. We can't tell apart without
      // per-field type info; log a sample so an operator can investigate.
      const sample = Array.from(unmapped).slice(0, 10);
      logger.warn(
        `AppSnapshot.import: ${unmapped.size} UUID(s) passed through without translation. ` +
          `Sample: ${sample.join(', ')}${unmapped.size > sample.length ? ` (+${unmapped.size - sample.length} more)` : ''}`
      );
    }

    return result;
  }
}

const logger = new Logger('AppSnapshot');

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function collectCorBySourceId(tree: unknown): Map<string, string> {
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
  corBySourceId: Map<string, string>,
  targetIdByCor: Map<string, string>,
  unmapped: Set<string>
): void {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const v = obj[i];
      if (typeof v === 'string') obj[i] = rewriteUuidsInString(v, corBySourceId, targetIdByCor, unmapped);
      else rewriteUuidsInAllStrings(v, corBySourceId, targetIdByCor, unmapped);
    }
    return;
  }
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    // slug is a URL identifier, not a UUID reference; co_relation_id is the
    // stable cor key itself, not a translatable reference.
    if (key === 'slug' || key === 'co_relation_id') continue;
    const v = record[key];
    if (typeof v === 'string') record[key] = rewriteUuidsInString(v, corBySourceId, targetIdByCor, unmapped);
    else rewriteUuidsInAllStrings(v, corBySourceId, targetIdByCor, unmapped);
  }
}

function rewriteUuidsInString(
  value: string,
  corBySourceId: Map<string, string>,
  targetIdByCor: Map<string, string>,
  unmapped: Set<string>
): string {
  return value.replace(UUID_V4_REGEX_GLOBAL, (match) => {
    // Chained lookup: source-local → cor → target-local. Either step may miss
    // (embedded refs are often cor_ids directly; unknown UUIDs pass through).
    const cor = corBySourceId.get(match) ?? match;
    const target = targetIdByCor.get(cor);
    if (target !== undefined) return target;
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
  targetIdByCor: Map<string, string>
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
    if (targetIdByCor.has(corId)) continue;
    targetIdByCor.set(corId, existingByCor.get(corId) ?? uuid());
  }
}

async function resolveAppVersions(
  tree: AppData,
  manager: EntityManager,
  policy: Policy,
  targetIdByCor: Map<string, string>,
  corBySourceId: Map<string, string>
): Promise<void> {
  const items = toArray(tree.versions);
  if (items.length === 0) return;

  // Versions are app-scoped (UNIQUE on (app_id, co_relation_id)), so we
  // translate each parent appId source→cor→target before scoping the lookup.
  const localAppIds = new Set<string>();
  for (const v of items) {
    const sourceAppId = v.appId;
    if (typeof sourceAppId !== 'string') continue;
    const appCor = corBySourceId.get(sourceAppId);
    if (!appCor) continue;
    const targetAppId = targetIdByCor.get(appCor);
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
    if (targetIdByCor.has(corId)) continue;
    targetIdByCor.set(corId, existingByCor.get(corId) ?? uuid());
  }
}

async function resolveDataSources(
  tree: AppData,
  manager: EntityManager,
  organizationId: string,
  policy: Policy,
  targetIdByCor: Map<string, string>
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
    if (targetIdByCor.has(corId)) continue;
    targetIdByCor.set(corId, existingByCor.get(corId) ?? uuid());
  }
}

function assignFreshIdsToChildren(tree: AppData, targetIdByCor: Map<string, string>): void {
  const assign = (item: Record<string, unknown>) => {
    const cor = item.co_relation_id;
    if (typeof cor === 'string' && !targetIdByCor.has(cor)) targetIdByCor.set(cor, uuid());
  };
  for (const folder of CHILD_FOLDERS) {
    for (const item of toArray(tree[folder])) assign(item);
  }
  for (const component of toArray(tree.components)) {
    for (const layout of toArray(component.layouts)) assign(layout);
  }
}

function indexByCorId(rows: { id: string; co_relation_id: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.co_relation_id) map.set(row.co_relation_id, row.id);
  }
  return map;
}
