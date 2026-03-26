import { AddDataSourceToFolderDto, BulkMoveDataSourcesDto, CreateFolderDataSourceDto, UpdateFolderDataSourceDto } from '../dto';

export interface IFolderDataSourcesService {
  createFolder(user: any, dto: CreateFolderDataSourceDto): Promise<void | object>;
  renameFolder(user: any, id: string, dto: UpdateFolderDataSourceDto): Promise<void | object>;
  deleteFolder(user: any, id: string): Promise<void | object>;
  addDataSourceToFolder(user: any, folderId: string, dto: AddDataSourceToFolderDto): Promise<void | object>;
  removeDataSourceFromFolder(user: any, folderId: string, dataSourceId: string): Promise<void | object>;
  bulkMoveDataSources(user: any, folderId: string, dto: BulkMoveDataSourcesDto): Promise<void | object>;
  getFolders(user: any, searchKey?: string, includeDataSources?: boolean): Promise<void | object>;
  getDataSourcesInFolder(user: any, folderId: string, page?: number, perPage?: number): Promise<void | object>;
}
