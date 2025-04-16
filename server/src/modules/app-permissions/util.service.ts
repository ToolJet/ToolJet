import { User } from '@entities/user.entity';
import { IUtilService } from './interfaces/IUtilService';
import { Injectable } from '@nestjs/common';
import { GroupPermissions } from '@entities/group_permissions.entity';

@Injectable()
export class AppPermissionsUtilService implements IUtilService {
  constructor() {}

  async getUserGroupsWithViewAccess(appId: string, organizationId: string): Promise<GroupPermissions[]> {
    throw new Error('Method not implemented.');
  }

  async getUsersWithViewAccess(appId: string, organizationId: string, endUserIds: string[]): Promise<User[]> {
    throw new Error('Method not implemented.');
  }
}
