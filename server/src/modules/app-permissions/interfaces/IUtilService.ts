import { User } from '@entities/user.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { CreatePagePermissionDto } from '../dto';

export interface IUtilService {
  getUsersWithViewAccess(appId: string, organizationId: string): Promise<User[]>;

  getUserGroupsWithViewAccess(appId: string, organizationId: string): Promise<GroupPermissions[]>;

  createPagePermission(pageId: string, body: CreatePagePermissionDto): Promise<any>;

  updatePagePermission(pageId: string, body: CreatePagePermissionDto): Promise<any>;
}
