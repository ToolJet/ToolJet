import { FolderDataSource } from '@entities/folder_data_source.entity';
import { User } from '@entities/user.entity';

export interface IFolderDataSourcesService {
  getFolders(user: User, query: { searchKey?: string; branchId?: string }): Promise<any>;
  create(folderId: string, dataSourceId: string, branchId?: string, organizationId?: string): Promise<FolderDataSource>;
  bulkCreate(
    folderId: string,
    dataSourceIds: string[],
    branchId?: string,
    organizationId?: string
  ): Promise<FolderDataSource[]>;
  remove(folderId: string, dataSourceId: string, branchId?: string, organizationId?: string): Promise<void>;
}
