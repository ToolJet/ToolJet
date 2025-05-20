import { User } from '@entities/user.entity';
import { CreatePagePermissionDto } from '../dto';

export interface IAppPermissionsService {
  fetchUsers(appId: string, user: User): Promise<any>;

  fetchUserGroups(appId: string, user: User): Promise<any>;

  fetchPagePermissions(pageId: string): Promise<any>;

  createPagePermissions(pageId: string, body: CreatePagePermissionDto): Promise<any>;

  updatePagePermissions(appId: string, pageId: string, body: CreatePagePermissionDto, user: User): Promise<any>;

  deletePagePermissions(pageId: string): Promise<any>;
}
