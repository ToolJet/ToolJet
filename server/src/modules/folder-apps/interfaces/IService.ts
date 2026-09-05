import { FolderApp } from '@entities/folder_app.entity';
import { EntityManager } from 'typeorm';
export interface IFolderAppsService {
  create(folderId: string, appId: string, manager?: EntityManager): Promise<FolderApp>;
  remove(folderId: string, appId: string, manager?: EntityManager): Promise<void>;
  getFolders(user: { organizationId: string }, query: { type: string; searchKey?: string }): Promise<any>;
}
