import { User } from '@modules/app/decorators/user.decorator';
import { CreateFolderDto } from '../dto';
import { UpdateFolderDto } from '../dto';
export interface IFoldersController {
  create(req: { user: typeof User }, createFolderDto: CreateFolderDto): Promise<any>;
  update(user: typeof User, id: string, updateFolderDto: UpdateFolderDto): Promise<any>;
  delete(user: typeof User, id: string): Promise<any>;
}
