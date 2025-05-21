import { User } from '@entities/user.entity';
import { CreatePermissionDto } from '../dto';
import { PERMISSION_ENTITY_TYPE } from '../constants';

export interface IAppPermissionsService {
  fetchUsers(appId: string, user: User): Promise<any>;

  fetchUserGroups(appId: string, user: User): Promise<any>;

  fetchAppPermissions(type: PERMISSION_ENTITY_TYPE, id: string): Promise<any>;

  createAppPermissions(type: PERMISSION_ENTITY_TYPE, id: string, body: CreatePermissionDto): Promise<any>;

  updateAppPermissions(
    type: PERMISSION_ENTITY_TYPE,
    appId: string,
    id: string,
    body: CreatePermissionDto,
    user: User
  ): Promise<any>;

  deleteAppPermissions(type: PERMISSION_ENTITY_TYPE, id: string): Promise<any>;
}
