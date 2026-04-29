import { Injectable } from '@nestjs/common';
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

export interface FolderRefConfig {
  // FK fields whose value is an id pointing at another entity.
  fields: string[];
  // Nested folders inside this entity's JSON (today only layouts under components).
  nested?: Record<string, FolderRefConfig>;
}

/**
 * Which fields hold cross-entity references, keyed by folder name.
 *
 * The list of FK columns is auto-derived from TypeORM relation metadata
 * so that adding a @JoinColumn on an entity is automatically tracked.
 * Fields that exist in the exported JSON but have no entity-level
 * relation (denormalized columns, JSON-shape-only refs) stay declared
 * explicitly because TypeORM has no metadata for them.
 */
@Injectable()
export class FkReferenceMap {
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
  // plain string columns or fields denormalized into the JSON shape.
  private readonly DENORMALIZED_FK_FIELDS: Partial<Record<EntityFolder, string[]>> = {
    components: ['appVersionId', 'parent'],
    pages: ['appId'],
    events: ['componentId', 'targetId', 'sourceId', 'dataQueryId'],
    versions: ['homePageId'],
    dataQueryFolders: ['appVersionId'],
    dataQueryFolderMappings: ['parentId', 'childId'],
  };

  // Folders that appear nested inside another folder's JSON. Only one
  // such relationship today: layouts inside components.
  private readonly NESTED_FOLDERS: Partial<Record<EntityFolder, Record<string, EntityFolder>>> = {
    components: { layouts: 'layouts' },
  };

  private byFolder: Record<EntityFolder, FolderRefConfig>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    // Build once at construction. dataSource.getMetadata reads in-memory
    // entity metadata that is populated when TypeOrmModule registers
    // entities at module-config time, before any provider is instantiated.
    this.byFolder = {} as Record<EntityFolder, FolderRefConfig>;
    for (const folder of Object.keys(this.FOLDER_TO_ENTITY) as EntityFolder[]) {
      this.byFolder[folder] = this.buildFolderConfig(folder);
    }
  }

  /** All FK metadata for a folder in one bundle. */
  config(folder: EntityFolder): FolderRefConfig | undefined {
    return this.byFolder[folder];
  }

  /** Folder name as enum, or undefined for unknown folders. */
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
