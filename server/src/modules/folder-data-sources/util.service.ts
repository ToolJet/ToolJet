import { Injectable } from '@nestjs/common';
import { EntityManager, In, SelectQueryBuilder } from 'typeorm';
import { FolderDataSource } from '@entities/folder_data_source.entity';
import { Folder } from '@entities/folder.entity';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import { dbTransactionWrap, getConnectionInstance } from '@helpers/database.helper';
import { IFolderDataSourcesUtilService } from './interfaces/IUtilService';

@Injectable()
export class FolderDataSourcesUtilService implements IFolderDataSourcesUtilService {
  // Builds the data-source-folder tree for a branch, keeping only the data sources present in
  // `permittedDataSourceIds` (which the caller has already permission-filtered upstream, so no
  // permission is resolved here). Folders left with no permitted data source are dropped. Returns
  // lightweight `{ id, name, type, organizationId, createdAt, updatedAt, dataSourceIds }` rows —
  // just the ids, since the caller already holds the full data-source objects.
  async getFoldersWithDataSourceIds(
    organizationId: string,
    branchId: string,
    permittedDataSourceIds: string[],
    manager?: EntityManager
  ): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      organizationId: string;
      createdAt: Date;
      updatedAt: Date;
      dataSourceIds: string[];
    }>
  > {
    if (!organizationId || !branchId || permittedDataSourceIds.length === 0) return [];

    return dbTransactionWrap(async (manager: EntityManager) => {
      const folders = await manager.find(Folder, {
        where: { organizationId, type: DATA_SOURCE_FOLDER_TYPE },
      });
      if (folders.length === 0) return [];

      const memberships = await this.findFolderDataSourcesForFolders(
        folders.map((folder) => folder.id),
        branchId,
        manager
      );

      const permitted = new Set(permittedDataSourceIds);
      const dataSourceIdsByFolder = new Map<string, string[]>();
      for (const membership of memberships) {
        if (!permitted.has(membership.dataSourceId)) continue;
        const bucket = dataSourceIdsByFolder.get(membership.folderId) ?? [];
        bucket.push(membership.dataSourceId);
        dataSourceIdsByFolder.set(membership.folderId, bucket);
      }

      return folders
        .filter((folder) => (dataSourceIdsByFolder.get(folder.id)?.length ?? 0) > 0)
        .map((folder) => ({
          id: folder.id,
          name: folder.name,
          type: folder.type,
          organizationId: folder.organizationId,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt,
          dataSourceIds: dataSourceIdsByFolder.get(folder.id) ?? [],
        }));
    }, manager);
  }

  async findFolderDataSourcesForFolders(
    folderIds: string[],
    branchId: string,
    manager: EntityManager,
    searchKey?: string,
    viewableDataSourceIds?: string[] | null
  ): Promise<FolderDataSource[]> {
    if (folderIds.length === 0) return [];
    const query = this.buildFolderDataSourcesQuery(manager, folderIds, branchId, searchKey);

    // Permission seam: callers that have already resolved which global data sources the user may
    // see pass those ids to scope the listing. `null`/`undefined` means "no filtering here" (the
    // caller filters elsewhere); an empty array means "nothing visible".
    if (viewableDataSourceIds != null) {
      if (viewableDataSourceIds.length === 0) return [];
      query.andWhere('folder_data_sources.data_source_id IN (:...viewableDataSourceIds)', { viewableDataSourceIds });
    }

    return query.getMany();
  }

  protected buildFolderDataSourcesQuery(
    manager: EntityManager,
    folderIds: string[],
    branchId: string,
    searchKey?: string
  ): SelectQueryBuilder<FolderDataSource> {
    // branch_id is NOT NULL on folder_data_sources, so there is no `IS NULL` legacy case to handle
    // (unlike folder_apps). The inner join to an ACTIVE data_source_versions row on the same branch
    // is the branch-presence check: a data source removed from the branch (soft-delete flips
    // is_active=false; default-branch delete drops the DSV row) disappears from the folder even if
    // its folder_data_sources row still lingers.
    const query = manager
      .createQueryBuilder(FolderDataSource, 'folder_data_sources')
      .innerJoin(
        'data_source_versions',
        'dsv',
        'dsv.data_source_id = folder_data_sources.data_source_id AND dsv.branch_id = folder_data_sources.branch_id AND dsv.is_active = true'
      )
      .where('folder_data_sources.folder_id IN (:...folderIds) AND folder_data_sources.branch_id = :branchId', {
        folderIds,
        branchId,
      });

    if (searchKey) {
      // The data source's name lives on the branch's DSV row (dsv.name), not on data_sources.
      query.andWhere('LOWER(dsv.name) LIKE :searchKey', { searchKey: `%${searchKey.toLowerCase()}%` });
    }

    return query;
  }

  async create(folderId: string, dataSourceId: string, branchId: string): Promise<FolderDataSource> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existing = await manager.findOne(FolderDataSource, { where: { dataSourceId, branchId } });

      // Idempotent: git-sync pull re-runs folder assignment on every pull.
      if (existing?.folderId === folderId) return existing;
      // Data source is in a different folder on this branch — move it (one folder per DS per branch).
      if (existing) await manager.delete(FolderDataSource, { id: existing.id });

      const row = manager.create(FolderDataSource, { folderId, dataSourceId, branchId });
      return manager.save(FolderDataSource, row);
    });
  }

  async bulkCreate(folderId: string, dataSourceIds: string[], branchId: string): Promise<FolderDataSource[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existing = await manager.find(FolderDataSource, {
        where: { dataSourceId: In(dataSourceIds), branchId },
      });
      const alreadyInFolder = new Set(existing.filter((r) => r.folderId === folderId).map((r) => r.dataSourceId));
      const toMove = existing.filter((r) => r.folderId !== folderId);

      if (toMove.length > 0) {
        await manager.delete(FolderDataSource, { id: In(toMove.map((r) => r.id)) });
      }

      const toCreate = dataSourceIds.filter((id) => !alreadyInFolder.has(id));
      if (toCreate.length === 0) return [];

      const rows = toCreate.map((dataSourceId) =>
        manager.create(FolderDataSource, { folderId, dataSourceId, branchId })
      );
      return manager.save(FolderDataSource, rows);
    });
  }

  async remove(folderId: string, dataSourceId: string, branchId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(FolderDataSource, { folderId, dataSourceId, branchId });
    });
  }

  async removeDataSourceFromFolders(dataSourceId: string, branchId: string, manager: EntityManager): Promise<void> {
    // Runs inside the caller's delete transaction (the data-source remove path), so it takes the
    // manager rather than opening its own. Scoped to this branch only — the same data source may
    // stay foldered on other branches.
    await manager.delete(FolderDataSource, { dataSourceId, branchId });
  }

  protected getManager(): EntityManager {
    return getConnectionInstance().manager;
  }
}
