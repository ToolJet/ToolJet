import { User } from '@entities/user.entity';
import { IUtilService } from './interfaces/IUtilService';
import { Injectable } from '@nestjs/common';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { CreatePagePermissionDto } from './dto';

@Injectable()
export class AppPermissionsUtilService implements IUtilService {
  constructor() {}

  async getUserGroupsWithViewAccess(appId: string, organizationId: string): Promise<GroupPermissions[]> {
    throw new Error('Method not implemented.');
  }

  async getUsersWithViewAccess(appId: string, organizationId: string): Promise<User[]> {
    throw new Error('Method not implemented.');
  }

  async createPagePermission(pageId: string, body: CreatePagePermissionDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async updatePagePermission(pageId: string, body: CreatePagePermissionDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
