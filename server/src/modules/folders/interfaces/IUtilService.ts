import { Folder } from 'src/entities/folder.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';

export interface IFoldersUtilService {
  allFolders(user: User, manager: EntityManager, type?: string): Promise<Folder[]>;
  findOne(folderId: string, manager: EntityManager): Promise<Folder>;
}
