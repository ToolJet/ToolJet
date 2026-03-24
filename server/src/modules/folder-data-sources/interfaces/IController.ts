import { AddDataSourceToFolderDto, BulkMoveDataSourcesDto, CreateFolderDataSourceDto, UpdateFolderDataSourceDto } from '../dto';

export interface IFolderDataSourcesController {
  create(user: any, dto: CreateFolderDataSourceDto): Promise<void | object>;
  update(user: any, id: string, dto: UpdateFolderDataSourceDto): Promise<void | object>;
  delete(user: any, id: string): Promise<void | object>;
  addDataSource(user: any, folderId: string, dto: AddDataSourceToFolderDto): Promise<void | object>;
  removeDataSource(user: any, folderId: string, dataSourceId: string): Promise<void | object>;
  bulkMoveDataSources(user: any, folderId: string, dto: BulkMoveDataSourcesDto): Promise<void | object>;
  getFolders(user: any, search?: string, includeDataSources?: string): Promise<void | object>;
  getDataSourcesInFolder(user: any, id: string, page?: string, perPage?: string): Promise<void | object>;
}
