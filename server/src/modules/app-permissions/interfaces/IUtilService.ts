import { User } from '@entities/user.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';

export interface IUtilService {
  getUsersWithViewAccess(appId: string, organizationId: string, endUserIds: string[]): Promise<User[]>;

  getUserGroupsWithViewAccess(appId: string, organizationId: string): Promise<GroupPermissions[]>;
}
