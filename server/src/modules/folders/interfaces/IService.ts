import { CreateFolderDto, UpdateFolderDto } from '../dto';
export interface IFoldersService {
  createFolder(req: { user: any }, createFolderDto: CreateFolderDto): Promise<void | object>;
  updateFolder(user: any, id: string, updateFolderDto: UpdateFolderDto): Promise<void | object>;
  deleteFolder(user: any, id: string): Promise<void | object>;
}
