import { Injectable } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { GroupUsers } from 'src/entities/group_users.entity';
import * as _ from 'lodash';
import { GroupPermissionsRepository } from './repository';
import { GroupPermissionsUtilService } from './util.service';
import { GetUsersResponse } from './types';
import { RolesUtilService } from '@modules/roles/util.service';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { GroupPermissionsDuplicateService } from './services/duplicate.service';
import { AddGroupUserDto, DuplicateGroupDtoBase, UpdateGroupPermissionDto } from './dto';
import { ResourceType } from './constants';
import { RolesRepository } from '@modules/roles/repository';
import { IGroupPermissionsService } from './interfaces/IService';
import { GroupPermissionLicenseUtilService } from './util-services/license.util.service';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { User } from '@entities/user.entity';

@Injectable()
export class GroupPermissionsService implements IGroupPermissionsService {
  constructor(
    protected readonly groupPermissionsUtilService: GroupPermissionsUtilService,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly groupPermissionsRepository: GroupPermissionsRepository,
    protected readonly roleUtilService: RolesUtilService,
    protected readonly groupPermissionsDuplicateService: GroupPermissionsDuplicateService,
    protected readonly roleRepository: RolesRepository,
    protected readonly licenseUtilService: GroupPermissionLicenseUtilService
  ) { }

  async create(user: User, name: string): Promise<GroupPermissions> {
    const groupPermissionResponse = await this.groupPermissionsUtilService.create(user, name);
    //GROUP_PERMISSION_CREATE audit
    const auditLogsData = {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: groupPermissionResponse.id,
      resourceName: name,
      resourceData: {
        group_details: {
          name: name,
        },
      },
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    return groupPermissionResponse;
  }

  getGroup(organizationId: string, id: string): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }> {
    return this.groupPermissionsUtilService.getGroupWithBuilderLevel(id, organizationId);
  }

  getAllGroup(organizationId: string): Promise<GetUsersResponse> {
    return this.groupPermissionsUtilService.getAllGroupByOrganization(organizationId);
  }

  async updateGroup(id: string, user: User, updateGroupPermissionDto: UpdateGroupPermissionDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await this.groupPermissionsUtilService.updateGroup(id, user, updateGroupPermissionDto, manager);
    });
  }

  async deleteGroup(id: string, user: User): Promise<void> {
    return await this.groupPermissionsUtilService.deleteGroup(id, user);
  }

  async duplicateGroup(
    groupId: string,
    user: User,
    duplicateGroupDto: DuplicateGroupDtoBase
  ): Promise<GroupPermissions> {
    const { addApps, addPermission, addUsers } = duplicateGroupDto;
    const organizationId = user.organizationId;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.groupPermissionsRepository.getGroup({ id: groupId, organizationId }, manager);
      const groupCopy = JSON.parse(JSON.stringify(group));
      // Create new Group
      const newGroup = await this.groupPermissionsDuplicateService.duplicateGroup(group, addPermission, manager);

      if (addUsers) {
        // Add Users
        const groupUsers = await this.groupPermissionsRepository.getUsersInGroup(
          groupId,
          organizationId,
          null,
          manager
        );

        manager.insert(
          GroupUsers,
          groupUsers.map((user) => ({ userId: user.user.id, groupId: newGroup.id }))
        );
      }
      if (addApps) {
        const allGranularPermissions = await this.groupPermissionsRepository.getAllGranularPermissions(
          { groupId },
          organizationId,
          manager
        );

        if (addApps) {
          const appsGranularPermission = allGranularPermissions.filter((perm) => perm.type == ResourceType.APP);
          await Promise.all(
            appsGranularPermission.map(async (permissions) => {
              //Deep cloning here cause the object will be updated in the function
              const permissionsToDuplicate = _.cloneDeep(permissions);
              const granularPermission = await this.groupPermissionsDuplicateService.duplicateGranularPermissions(
                permissionsToDuplicate,
                newGroup.id,
                manager
              );
              await this.groupPermissionsDuplicateService.duplicateResourcePermissions(
                permissions,
                granularPermission.id,
                manager
              );
            })
          );
        }
        // CE - EE changes - removed data source
      }

      await this.licenseUserService.validateUser(manager, organizationId);

      //GROUP_PERMISSION_DUPLICATE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: groupCopy.id,
        resourceName: groupCopy.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
      return newGroup;
    });
  }

  async addGroupUsers(addGroupUserDto: AddGroupUserDto, user: User, manager?: EntityManager) {
    const { userIds } = addGroupUserDto;
    const organizationId = user.organizationId;

    if (!userIds && userIds.length === 0) {
      return;
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.groupPermissionsUtilService.addUsersToGroup(addGroupUserDto, organizationId, manager);
      await this.licenseUserService.validateUser(manager, organizationId);
      const group = await this.groupPermissionsRepository.getGroup(
        { id: addGroupUserDto.groupId, organizationId: organizationId },
        manager
      );
      //USER_ADD_TO_GROUP audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: group.id,
        resourceName: group.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    }, manager);
  }

  async getAllGroupUsers(group: GroupPermissions, organizationId: string, searchInput?: string): Promise<GroupUsers[]> {
    return await this.groupPermissionsRepository.getUsersInGroup(group.id, organizationId, searchInput);
  }

  async deleteGroupUser(id: string, user: User, manager?: EntityManager): Promise<void> {
    return await this.groupPermissionsUtilService.deleteGroupUser(id, user, manager);
  }

  async getAddableUser(groupId: string, organizationId: string, searchInput?: string) {
    return await this.groupPermissionsRepository.addableUsersToGroup(groupId, organizationId, searchInput);
  }
}
