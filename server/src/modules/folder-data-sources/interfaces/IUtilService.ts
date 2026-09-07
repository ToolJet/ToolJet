import { FolderDataSource } from '@entities/folder_data_source.entity';
import { EntityManager } from 'typeorm';

export interface IFolderDataSourcesUtilService {
  /**
   * Branch-scoped folder membership for the given folders. Only returns rows whose data source is
   * actually present (and not soft-deleted) on the branch — enforced by an inner join to an active
   * data_source_versions row, the analogue of folder-apps' app_versions presence join.
   */
  findFolderDataSourcesForFolders(
    folderIds: string[],
    branchId: string,
    manager: EntityManager,
    searchKey?: string,
    viewableDataSourceIds?: string[] | null
  ): Promise<FolderDataSource[]>;

  create(folderId: string, dataSourceId: string, branchId: string): Promise<FolderDataSource>;

  bulkCreate(folderId: string, dataSourceIds: string[], branchId: string): Promise<FolderDataSource[]>;

  remove(folderId: string, dataSourceId: string, branchId: string): Promise<void>;

  /**
   * Drop a data source's folder mapping on one branch. Called when the data source is removed from
   * that branch (soft-delete on a feature branch, hard-delete on the default branch) — cases where
   * the data_sources row and the branch both survive, so neither FK cascade fires and the mapping
   * would otherwise linger.
   */
  removeDataSourceFromFolders(dataSourceId: string, branchId: string, manager: EntityManager): Promise<void>;
}
