import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EntityFolder, FkReferenceMap, FolderRefConfig } from './fk-reference-map';

/**
 * AppData = the in-memory shape used by export/import/git flows. Today's
 * legacy export tree (apps, components, pages, queries, …); we keep it
 * untyped here because nominal typing for that whole tree is out of scope.
 */
export type AppData = Record<string, unknown>;

/**
 * Snapshot = the portable form. Local DB ids replaced with co_relation_ids,
 * instance-scoped fields stripped. Safe to write to a file tree, send over
 * the wire, or hand to another instance.
 */
export type Snapshot = Record<string, unknown>;

const UUID_V4_REGEX_GLOBAL =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g;

/**
 * Fields that exist locally but must not appear in a snapshot: timestamps
 * that drift across instances, FK columns to instance-scoped tables
 * (workspace_branch, environment, user), and bookkeeping like pulledAt.
 */
const STRIP_FIELDS: Partial<
  Record<EntityFolder, { fields?: string[]; nested?: Record<string, { fields: string[] }> }>
> = {
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
 * Every flow that crosses an instance boundary — git push, git pull, JSON
 * export, JSON import, branch-create — calls this service instead of
 * holding its own rewrite map. That's what guarantees the §0 invariant:
 * a manual JSON export/import on instance B produces the same DB state as
 * a git push/pull from A to B.
 */
@Injectable()
export class AppSnapshot {
  constructor(private readonly fkMap: FkReferenceMap) {}

  /**
   * DB → wire. Walks the entity tree, replaces every local-id reference
   * with its co_relation_id. The result is safe to persist outside this
   * instance.
   *
   * `extraIds` lets callers seed the local→cor map for entities not in
   * the tree (e.g. workspace-scoped data sources referenced by query
   * dataSourceId).
   */
  take(appData: AppData, extraIds?: Map<string, string>): Snapshot {
    const snapshot = clone(appData) as Snapshot;
    const localToCor = collectLocalToCor(snapshot);
    if (extraIds) for (const [k, v] of extraIds) if (!localToCor.has(k)) localToCor.set(k, v);

    // Build the local→cor map first (needs co_relation_id present), then
    // swap id ← co_relation_id everywhere so the wire shape carries only
    // portable identity. Order matters: the swap erases co_relation_id.
    swapIdToCorRecursive(snapshot);

    for (const [folderName, content] of Object.entries(snapshot)) {
      const folder = this.fkMap.resolveFolder(folderName);
      if (!folder) continue;
      const items = Array.isArray(content) ? content : content ? [content] : [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const record = item as Record<string, unknown>;
        rewriteFkFields(record, this.folderConfig(folder), localToCor);
        rewriteUuidsInAllStrings(record, localToCor);
        applyStripList(record, folder);
      }
    }

    return snapshot;
  }

  /**
   * Wire → DB. Walks the snapshot in dependency order, looks up the local
   * row for each co_relation_id (reusing existing local ids when matched,
   * generating new ones when not), and rewrites every reference to the
   * resolved local id before insert/update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async restore(_snapshot: Snapshot, _manager: EntityManager): Promise<AppData> {
    throw new Error('AppSnapshot.restore not implemented yet');
  }

  private folderConfig(folder: EntityFolder): FolderRefConfig {
    return { fields: this.fkMap.fields(folder), nested: this.fkMap.nested(folder) };
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

function rewriteFkFields(
  record: Record<string, unknown>,
  config: FolderRefConfig,
  localToCor: Map<string, string>
): void {
  for (const field of config.fields) {
    const value = record[field];
    if (typeof value !== 'string') continue;
    const mapped = rewriteUuidsInString(value, localToCor);
    if (mapped !== value) record[field] = mapped;
  }
  if (!config.nested) return;
  for (const [key, nestedConfig] of Object.entries(config.nested)) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      for (const child of nested) {
        if (child && typeof child === 'object') {
          rewriteFkFields(child as Record<string, unknown>, nestedConfig, localToCor);
        }
      }
    } else if (nested && typeof nested === 'object') {
      rewriteFkFields(nested as Record<string, unknown>, nestedConfig, localToCor);
    }
  }
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
    const v = record[key];
    if (typeof v === 'string') record[key] = rewriteUuidsInString(v, localToCor);
    else rewriteUuidsInAllStrings(v, localToCor);
  }
}

function rewriteUuidsInString(value: string, localToCor: Map<string, string>): string {
  return value.replace(UUID_V4_REGEX_GLOBAL, (uuid) => localToCor.get(uuid) ?? uuid);
}

function applyStripList(record: Record<string, unknown>, folder: EntityFolder): void {
  const config = STRIP_FIELDS[folder];
  if (!config) return;
  for (const f of config.fields ?? []) delete record[f];
  if (!config.nested) return;
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
