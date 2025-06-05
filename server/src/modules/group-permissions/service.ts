import { Injectable, BadRequestException, MethodNotAllowedException, ForbiddenException } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { catchDbException } from 'src/helpers/utils.helper';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { GroupUsers } from 'src/entities/group_users.entity';
import * as _ from 'lodash';
import { GroupPermissionsRepository } from './repository';
import { GroupPermissionsUtilService } from './util.service';
import { CreateDefaultGroupObject, GetUsersResponse } from './types';
import { RolesUtilService } from '@modules/roles/util.service';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { GroupPermissionsDuplicateService } from './services/duplicate.service';
import { AddGroupUserDto, DuplicateGroupDtoBase, UpdateGroupPermissionDto } from './dto';
import { GROUP_PERMISSIONS_TYPE, ResourceType, USER_ROLE } from './constants';
import { DATA_BASE_CONSTRAINTS, ERROR_HANDLER } from './constants/error';
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
  ) {}

  async create(user: User, name: string): Promise<GroupPermissions> {
    const groupCreateObj: CreateDefaultGroupObject = { name };
    this.groupPermissionsUtilService.validateCreateGroupOperation(groupCreateObj);
    const groupPermissionResponse = await this.groupPermissionsRepository.createGroup(
      user.organizationId,
      groupCreateObj
    );
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
      const organizationId = user.organizationId;
      const group = await this.groupPermissionsRepository.getGroup({ id, organizationId }, manager);
      // License validation - Update not allowed on basic plan
      const isLicenseValid = await this.licenseUtilService.isValidLicense();
      if (!isLicenseValid && group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP) {
        throw new ForbiddenException(ERROR_HANDLER.INVALID_LICENSE);
      }

      // Check if name is reserved
      this.groupPermissionsUtilService.validateUpdateGroupOperation(group, updateGroupPermissionDto);

      const { allowRoleChange } = updateGroupPermissionDto;
      delete updateGroupPermissionDto.allowRoleChange;

      // Some permission are enabled
      const editPermissionsPresent = Object.keys(updateGroupPermissionDto).some(
        (value) => typeof updateGroupPermissionDto?.[value] === 'boolean' && updateGroupPermissionDto?.[value] === true
      );
      if (editPermissionsPresent) {
        const usersInGroup = await this.groupPermissionsRepository.getUsersInGroup(id, organizationId, null, manager);

        if (usersInGroup?.length) {
          // no need to proceed if there are no users in the group
          const endUsersList = await this.roleRepository.getRoleUsersList(
            USER_ROLE.END_USER,
            organizationId,
            usersInGroup.map((groupUser) => groupUser.userId),
            manager
          );

          if (endUsersList.length) {
            if (!allowRoleChange) {
              // Not allowed to change user roles, throwing error
              throw new MethodNotAllowedException({
                message: {
                  error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
                  data: endUsersList?.map((user) => user.email),
                  title: 'Cannot add this permission to the group',
                  type: 'USER_ROLE_CHANGE',
                },
              });
            }
            // Permission is updated, converting end users to builders
            await this.roleUtilService.changeEndUserToEditor(
              organizationId,
              endUsersList.map((user) => user.id),
              endUsersList[0].userGroups[0].group.id,
              manager
            );
          }
        }
      }
      // Updating group permissions
      await catchDbException(async () => {
        await manager.update(GroupPermissions, id, updateGroupPermissionDto);
      }, [DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE]);

      // Validating license
      await this.licenseUserService.validateUser(manager);
      //GROUP_PERMISSION_UPDATE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: group.id,
        resourceName: group.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    });
  }

  async deleteGroup(id: string, user: User): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const organizationId = user.organizationId;
      const group = await this.groupPermissionsRepository.getGroup({ id, organizationId }, manager);

      if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT) {
        throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_UPDATE_NOT_ALLOWED);
      }
      //GROUP_PERMISSION_DELETE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: group.id,
        resourceName: group.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
      await manager.delete(GroupPermissions, id);
    });
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

      await this.licenseUserService.validateUser(manager);

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
      await this.licenseUserService.validateUser(manager);
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
    const organizationId = user.organizationId;
    await dbTransactionWrap(async (manager: EntityManager) => {
      const groupUser = await this.groupPermissionsRepository.getGroupUser(id, manager);
      this.groupPermissionsUtilService.validateDeleteGroupUserOperation(groupUser?.group, organizationId);
      console.log('group user group', groupUser?.group);
      await this.groupPermissionsRepository.removeUserFromGroup(id);
      //USER_REMOVE_FROM_GROUP audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: groupUser?.group.id,
        resourceName: groupUser?.group.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    }, manager);
  }

  async getAddableUser(groupId: string, organizationId: string, searchInput?: string) {
    return await this.groupPermissionsRepository.addableUsersToGroup(groupId, organizationId, searchInput);
  }
}
