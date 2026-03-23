import { AddDsToFolderDto, BulkMoveDsDto, CreateDsFolderDto, UpdateDsFolderDto } from '../dto';

export interface IFolderDataSourcesController {
  create(user: any, dto: CreateDsFolderDto): Promise<void | object>;
  update(user: any, id: string, dto: UpdateDsFolderDto): Promise<void | object>;
  delete(user: any, id: string): Promise<void | object>;
  addDataSource(user: any, folderId: string, dto: AddDsToFolderDto): Promise<void | object>;
  removeDataSource(user: any, folderId: string, dataSourceId: string): Promise<void | object>;
  bulkMoveDataSources(user: any, folderId: string, dto: BulkMoveDsDto): Promise<void | object>;
}
