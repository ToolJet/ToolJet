import { FolderApp } from '@entities/folder_app.entity';
export interface IFolderAppsService {
  create(folderId: string, appId: string, branchId?: string): Promise<FolderApp>;
  bulkCreate(folderId: string, appIds: string[], branchId?: string): Promise<FolderApp[]>;
  remove(folderId: string, appId: string, branchId?: string): Promise<void>;
  getFolders(user: { organizationId: string }, query: { type: string; searchKey?: string; branchId?: string }): Promise<any>;
}
