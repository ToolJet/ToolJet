import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget } from 'typeorm';
import { Component } from '@entities/component.entity';
import { Page } from '@entities/page.entity';
import { DataQuery } from '@entities/data_query.entity';
import { EventHandler } from '@entities/event_handler.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Layout } from '@entities/layout.entity';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQueryFolderMapping } from '@entities/data_query_folder_mapping.entity';

export type EntityFolder =
  | 'components'
  | 'pages'
  | 'queries'
  | 'events'
  | 'versions'
  | 'layouts'
  | 'dataQueryFolders'
  | 'dataQueryFolderMappings';

export interface EmbeddedRefField {
  // Where in the entity's JSON property tree the reference lives,
  // e.g. "properties.moduleAppId.value".
  path: string;
  targetFolder: EntityFolder | 'apps';
}

export interface FolderRefConfig {
  // FK fields whose value is a single id pointing at another entity.
  fields: string[];
  // Nested folders (e.g. layouts inside components).
  nested?: Record<string, FolderRefConfig>;
}

/**
 * Single source of truth for "which fields hold cross-entity references"
 * across export, import, push, pull, branch-create.
 *
 * The list of FK columns is auto-derived from TypeORM relation metadata so
 * that adding a @JoinColumn on an entity is automatically tracked. Fields
 * that exist in the exported JSON but have no entity-level relation
 * (denormalized columns, JSON-shape-only refs, embedded property paths)
 * stay declared explicitly here because TypeORM has no metadata for them.
 */
@Injectable()
export class FkReferenceMap implements OnModuleInit {
  private readonly FOLDER_TO_ENTITY: Record<EntityFolder, EntityTarget<unknown>> = {
    components: Component,
    pages: Page,
    queries: DataQuery,
    events: EventHandler,
    versions: AppVersion,
    layouts: Layout,
    dataQueryFolders: DataQueryFolder,
    dataQueryFolderMappings: DataQueryFolderMapping,
  };

  // FKs that exist in the exported JSON but have no @JoinColumn relation —
  // e.g. plain string columns or fields denormalized into the JSON shape.
  private readonly DENORMALIZED_FK_FIELDS: Partial<Record<EntityFolder, string[]>> = {
    components: ['appVersionId', 'parent'],
    pages: ['appId'],
    events: ['componentId', 'targetId', 'sourceId', 'dataQueryId'],
    versions: ['homePageId'],
    dataQueryFolders: ['appVersionId'],
    dataQueryFolderMappings: ['parentId', 'childId'],
  };

  // Folders that appear nested inside another folder's JSON. Today only
  // layouts (under components).
  private readonly NESTED_FOLDERS: Partial<Record<EntityFolder, Record<string, EntityFolder>>> = {
    components: { layouts: 'layouts' },
  };

  // Fields the cleanup step deletes before write — strip from the FK list
  // so we don't waste rewrites on fields that won't be persisted.
  private readonly CLEANUP_FIELDS: Partial<Record<EntityFolder, string[]>> = {
    versions: ['parentVersionId', 'createdBy', 'currentEnvironmentId', 'branchId', 'pulledAt'],
  };

  // Embedded references inside JSON property trees. The translator looks
  // these up by structured path (e.g. properties.moduleAppId.value) and
  // rewrites them alongside the structured FK columns.
  private readonly EMBEDDED_REFS: Partial<Record<EntityFolder, EmbeddedRefField[]>> = {
    components: [
      { path: 'properties.moduleAppId.value', targetFolder: 'apps' },
      { path: 'properties.moduleVersionId.value', targetFolder: 'versions' },
      { path: 'properties.buttonToSubmit.value', targetFolder: 'components' },
    ],
  };

  private byFolder: Record<EntityFolder, FolderRefConfig> = {} as Record<EntityFolder, FolderRefConfig>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  onModuleInit(): void {
    for (const folder of Object.keys(this.FOLDER_TO_ENTITY) as EntityFolder[]) {
      this.byFolder[folder] = this.buildFolderConfig(folder);
    }
  }

  fields(folder: EntityFolder): string[] {
    return this.byFolder[folder]?.fields ?? [];
  }

  nested(folder: EntityFolder): Record<string, FolderRefConfig> | undefined {
    return this.byFolder[folder]?.nested;
  }

  embeddedRefs(folder: EntityFolder): EmbeddedRefField[] {
    return this.EMBEDDED_REFS[folder] ?? [];
  }

  /**
   * Folder containing this entity's row data, given the JSON-shape folder
   * name used by export/import. Used by the translator to look up FK
   * configs for arbitrary entity types it encounters during a tree walk.
   */
  resolveFolder(folder: string): EntityFolder | undefined {
    return folder in this.FOLDER_TO_ENTITY ? (folder as EntityFolder) : undefined;
  }

  private buildFolderConfig(folder: EntityFolder): FolderRefConfig {
    const fields = this.collectFkFields(folder);
    const nested = this.buildNested(folder);
    return nested ? { fields, nested } : { fields };
  }

  private collectFkFields(folder: EntityFolder): string[] {
    const set = new Set<string>();

    // Auto-derive: any @ManyToOne / @OneToOne(owner) relation contributes
    // its join-column property name (e.g. pageId, appVersionId).
    const metadata = this.dataSource.getMetadata(this.FOLDER_TO_ENTITY[folder]);
    for (const relation of metadata.relations) {
      if (!(relation.isManyToOne || relation.isOneToOneOwner)) continue;
      for (const joinCol of relation.joinColumns) {
        if (joinCol.propertyName) set.add(joinCol.propertyName);
      }
    }

    for (const f of this.CLEANUP_FIELDS[folder] ?? []) set.delete(f);
    for (const f of this.DENORMALIZED_FK_FIELDS[folder] ?? []) set.add(f);

    return Array.from(set);
  }

  private buildNested(folder: EntityFolder): Record<string, FolderRefConfig> | undefined {
    const map = this.NESTED_FOLDERS[folder];
    if (!map) return undefined;

    const result: Record<string, FolderRefConfig> = {};
    for (const [propertyKey, nestedFolder] of Object.entries(map)) {
      result[propertyKey] = this.buildFolderConfig(nestedFolder);
    }
    return result;
  }
}
