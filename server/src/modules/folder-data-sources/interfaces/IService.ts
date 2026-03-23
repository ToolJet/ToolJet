import { AddDsToFolderDto, BulkMoveDsDto, CreateDsFolderDto, UpdateDsFolderDto } from '../dto';

export interface IFolderDataSourcesService {
  createFolder(user: any, dto: CreateDsFolderDto): Promise<void | object>;
  renameFolder(user: any, id: string, dto: UpdateDsFolderDto): Promise<void | object>;
  deleteFolder(user: any, id: string): Promise<void | object>;
  addDataSourceToFolder(user: any, folderId: string, dto: AddDsToFolderDto): Promise<void | object>;
  removeDataSourceFromFolder(user: any, folderId: string, dataSourceId: string): Promise<void | object>;
  bulkMoveDataSources(user: any, folderId: string, dto: BulkMoveDsDto): Promise<void | object>;
  getFolders(user: any, searchKey?: string): Promise<void | object>;
  getDataSourcesInFolder(user: any, folderId: string): Promise<void | object>;
}
