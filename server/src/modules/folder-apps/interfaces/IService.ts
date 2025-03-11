import { FolderApp } from '@entities/folder_app.entity';
export interface IFolderAppsService {
  create(folderId: string, appId: string): Promise<FolderApp>;
  remove(folderId: string, appId: string): Promise<void>;
  getFolders(user: { organizationId: string }, query: { type: string; searchKey?: string }): Promise<any>;
}
