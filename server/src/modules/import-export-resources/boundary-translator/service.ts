import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EntityFolder, FkReferenceMap, FolderRefConfig } from './fk-reference-map';

/**
 * Untyped tree shape. Today's export/import already passes plain objects
 * around; promoting these to nominal types is out of scope for this phase.
 */
export type EntityTree = Record<string, unknown>;
export type PortableSnapshot = Record<string, unknown>;

const UUID_V4_REGEX_GLOBAL =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g;

/**
 * Fields that exist locally but must not appear in the portable snapshot:
 * timestamps that drift across instances, FK columns to instance-scoped
 * tables (workspace_branch, environment, user), and bookkeeping like
 * pulledAt. Same shape as git-sync-adapter's legacy ENTITY_CLEANUP_CONFIG;
 * lifted here because cleanup is part of the export contract, not git's.
 */
const CLEANUP_CONFIG: Partial<
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
 * Single boundary between local DB ids and portable co_relation_ids.
 *
 * Every flow that crosses an instance boundary — git push, git pull, JSON
 * export, JSON import, branch-create — calls this translator instead of
 * holding its own rewrite map. That's what guarantees the §0 invariant:
 * a manual JSON export/import on instance B produces the same DB state as
 * a git push/pull from A to B.
 */
@Injectable()
export class BoundaryTranslator {
  constructor(private readonly fkMap: FkReferenceMap) {}

  /**
   * DB → wire. Walks the entity tree, replaces every local-id reference
   * with its co_relation_id. Output is safe to persist outside this
   * instance (file tree, JSON download, network payload).
   *
   * Caller-supplied `extraIdMappings` lets dependents whose rows aren't
   * in the tree (e.g. workspace-scoped data sources referenced by query
   * dataSourceId) seed the local-id → cor_id map.
   */
  async toPortable(
    tree: EntityTree,
    _manager: EntityManager,
    extraIdMappings?: Map<string, string>
  ): Promise<PortableSnapshot> {
    const portable = this.deepClone(tree);
    const idMappings = this.buildIdMappings(portable);
    if (extraIdMappings) {
      for (const [local, cor] of extraIdMappings) {
        if (!idMappings.has(local)) idMappings.set(local, cor);
      }
    }

    // Build the local→cor map first (needs co_relation_id present), then
    // swap id ← co_relation_id everywhere so the wire shape carries only
    // portable identity. Order matters: the swap erases co_relation_id.
    this.swapIdsRecursive(portable);

    for (const [folderName, content] of Object.entries(portable)) {
      const folder = this.fkMap.resolveFolder(folderName);
      if (!folder) continue;
      const items = Array.isArray(content) ? content : content ? [content] : [];
      for (const item of items) this.translateItemToPortable(item, folder, idMappings);
    }

    return portable;
  }

  private swapIdsRecursive(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (const v of obj) this.swapIdsRecursive(v);
      return;
    }
    const record = obj as Record<string, unknown>;
    if (typeof record.id === 'string' && typeof record.co_relation_id === 'string') {
      record.id = record.co_relation_id;
      delete record.co_relation_id;
    }
    for (const v of Object.values(record)) this.swapIdsRecursive(v);
  }

  /**
   * Wire → DB. Walks the portable snapshot in dependency order, looks up
   * the local row for each co_relation_id (reusing existing local ids when
   * matched, generating new ones when not), and rewrites every reference
   * to the resolved local id before insert/update.
   */
  async toLocal(_snapshot: PortableSnapshot, _manager: EntityManager): Promise<EntityTree> {
    throw new Error('BoundaryTranslator.toLocal not implemented yet');
  }

  /**
   * Walks the tree once and collects {localId → co_relation_id} for every
   * entity carrying both. Drives the rewrite pass below.
   */
  private buildIdMappings(tree: PortableSnapshot): Map<string, string> {
    const mappings = new Map<string, string>();
    const visit = (obj: unknown): void => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        for (const v of obj) visit(v);
        return;
      }
      const record = obj as Record<string, unknown>;
      const id = record.id;
      const cor = record.co_relation_id;
      if (typeof id === 'string' && typeof cor === 'string') mappings.set(id, cor);
      for (const v of Object.values(record)) visit(v);
    };
    visit(tree);
    return mappings;
  }

  private translateItemToPortable(
    item: unknown,
    folder: EntityFolder,
    idMappings: Map<string, string>
  ): void {
    if (!item || typeof item !== 'object') return;
    const record = item as Record<string, unknown>;
    this.rewriteFieldsAndNested(record, this.folderConfig(folder), idMappings);
    this.replaceEmbeddedUuidsInAllStrings(record, idMappings);
    this.applyCleanup(record, folder);
  }

  private rewriteFieldsAndNested(
    record: Record<string, unknown>,
    config: FolderRefConfig,
    idMappings: Map<string, string>
  ): void {
    for (const field of config.fields) {
      const value = record[field];
      if (typeof value !== 'string') continue;
      const mapped = this.rewriteUuidsInString(value, idMappings);
      if (mapped !== value) record[field] = mapped;
    }
    if (!config.nested) return;
    for (const [propertyKey, nestedConfig] of Object.entries(config.nested)) {
      const nested = record[propertyKey];
      if (Array.isArray(nested)) {
        for (const child of nested) {
          if (child && typeof child === 'object') {
            this.rewriteFieldsAndNested(child as Record<string, unknown>, nestedConfig, idMappings);
          }
        }
      } else if (nested && typeof nested === 'object') {
        this.rewriteFieldsAndNested(nested as Record<string, unknown>, nestedConfig, idMappings);
      }
    }
  }

  private replaceEmbeddedUuidsInAllStrings(
    obj: unknown,
    idMappings: Map<string, string>
  ): void {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const v = obj[i];
        if (typeof v === 'string') obj[i] = this.rewriteUuidsInString(v, idMappings);
        else this.replaceEmbeddedUuidsInAllStrings(v, idMappings);
      }
      return;
    }
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      // slug is a URL identifier, not a UUID reference — never swap it.
      if (key === 'slug') continue;
      const v = record[key];
      if (typeof v === 'string') record[key] = this.rewriteUuidsInString(v, idMappings);
      else this.replaceEmbeddedUuidsInAllStrings(v, idMappings);
    }
  }

  private rewriteUuidsInString(value: string, idMappings: Map<string, string>): string {
    return value.replace(UUID_V4_REGEX_GLOBAL, (uuid) => idMappings.get(uuid) ?? uuid);
  }

  private applyCleanup(record: Record<string, unknown>, folder: EntityFolder): void {
    const config = CLEANUP_CONFIG[folder];
    if (!config) return;
    for (const f of config.fields ?? []) delete record[f];
    if (!config.nested) return;
    for (const [propertyKey, nestedConfig] of Object.entries(config.nested)) {
      const nested = record[propertyKey];
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

  private folderConfig(folder: EntityFolder): FolderRefConfig {
    return { fields: this.fkMap.fields(folder), nested: this.fkMap.nested(folder) };
  }

  private deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
