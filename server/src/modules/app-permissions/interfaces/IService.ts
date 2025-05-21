import { User } from '@entities/user.entity';
import { CreatePagePermissionDto } from '../dto';
import { PERMISSION_ENTITY_TYPE } from '../constants';

export interface IAppPermissionsService {
  fetchUsers(appId: string, user: User): Promise<any>;

  fetchUserGroups(appId: string, user: User): Promise<any>;

  fetchAppPermissions(type: PERMISSION_ENTITY_TYPE, pageId: string): Promise<any>;

  createAppPermissions(type: PERMISSION_ENTITY_TYPE, pageId: string, body: CreatePagePermissionDto): Promise<any>;

  updateAppPermissions(
    type: PERMISSION_ENTITY_TYPE,
    appId: string,
    pageId: string,
    body: CreatePagePermissionDto,
    user: User
  ): Promise<any>;

  deleteAppPermissions(type: PERMISSION_ENTITY_TYPE, pageId: string): Promise<any>;
}
