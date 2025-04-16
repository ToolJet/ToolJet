import { User } from '@entities/user.entity';

export interface IAppPermissionsService {
  fetchUsers(appId: string, user: User): Promise<any>;

  fetchUserGroups(appId: string, user: User): Promise<any>;
}
