import { Injectable } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { UpdateGroupPermissionDto } from '@dto/group-permission.dto';

@Injectable()
export class GroupPermissionsServiceV2 {
  constructor() {}

  async create(name: string, organizationId: string) {}

  //Should be part of organization of group user service
  async createDefaultGroup(organizationId: string) {}
  async defaultGroupCheck(groupObject: GroupPermissions) {}
  async deleteGroup(groupId: string) {}
  async updateGroup(groupId: string, updateGroupPermissionDto: UpdateGroupPermissionDto) {
    //Is editable only in paid plan builder group
  }
  async getGroup(groupId: string) {}
  async getAllGroup(organizationId: string) {}
  async createGroupUser(groupId: string, organizationId: string) {}
  async deleteGroupUser(groupId: string, organizationId: string) {}
}
