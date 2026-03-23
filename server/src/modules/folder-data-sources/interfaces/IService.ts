import { CreateDsFolderDto, UpdateDsFolderDto } from '../dto';

export interface IFolderDataSourcesService {
  createFolder(user: any, dto: CreateDsFolderDto): Promise<void | object>;
  renameFolder(user: any, id: string, dto: UpdateDsFolderDto): Promise<void | object>;
  deleteFolder(user: any, id: string): Promise<void | object>;
}
