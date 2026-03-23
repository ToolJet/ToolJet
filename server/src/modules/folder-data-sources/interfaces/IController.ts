import { CreateDsFolderDto, UpdateDsFolderDto } from '../dto';

export interface IFolderDataSourcesController {
  create(user: any, dto: CreateDsFolderDto): Promise<void | object>;
  update(user: any, id: string, dto: UpdateDsFolderDto): Promise<void | object>;
  delete(user: any, id: string): Promise<void | object>;
}
