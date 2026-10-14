import { CreateFolderDto, DeleteFolderDto, RenameFolderDto, ReorderDto } from '../dto';

export interface IDataQueryFoldersService {
  createFolder(dto: CreateFolderDto): Promise<any>;
  renameFolder(id: string, dto: RenameFolderDto): Promise<any>;
  deleteFolder(id: string, dto: DeleteFolderDto): Promise<void>;
  reorder(dto: ReorderDto): Promise<void>;
  getFolders(appVersionId: string): Promise<any>;
}
