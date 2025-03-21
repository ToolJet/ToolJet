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

  create(organizationId: string, name: string): Promise<GroupPermissions> {
    const groupCreateObj: CreateDefaultGroupObject = { name };
    this.groupPermissionsUtilService.validateCreateGroupOperation(groupCreateObj);
    return this.groupPermissionsRepository.createGroup(organizationId, groupCreateObj);
  }

  getGroup(organizationId: string, id: string): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }> {
    return this.groupPermissionsUtilService.getGroupWithBuilderLevel(id, organizationId);
  }

  getAllGroup(organizationId: string): Promise<GetUsersResponse> {
    return this.groupPermissionsUtilService.getAllGroupByOrganization(organizationId);
  }

  async updateGroup(id: string, organizationId: string, updateGroupPermissionDto: UpdateGroupPermissionDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
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
    });
  }

  async deleteGroup(id: string, organizationId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.groupPermissionsRepository.getGroup({ id, organizationId }, manager);

      if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT) {
        throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_UPDATE_NOT_ALLOWED);
      }
      await manager.delete(GroupPermissions, id);
    });
  }

  async duplicateGroup(
    groupId: string,
    organizationId: string,
    duplicateGroupDto: DuplicateGroupDtoBase
  ): Promise<GroupPermissions> {
    const { addApps, addPermission, addUsers } = duplicateGroupDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.groupPermissionsRepository.getGroup({ id: groupId, organizationId }, manager);

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
      return newGroup;
    });
  }

  async addGroupUsers(addGroupUserDto: AddGroupUserDto, organizationId: string, manager?: EntityManager) {
    const { userIds } = addGroupUserDto;

    if (!userIds && userIds.length === 0) {
      return;
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.groupPermissionsUtilService.addUsersToGroup(addGroupUserDto, organizationId, manager);
      await this.licenseUserService.validateUser(manager);
    }, manager);
  }

  async getAllGroupUsers(group: GroupPermissions, organizationId: string, searchInput?: string): Promise<GroupUsers[]> {
    return await this.groupPermissionsRepository.getUsersInGroup(group.id, organizationId, searchInput);
  }

  async deleteGroupUser(id: string, organizationId: string): Promise<void> {
    const groupUser = await this.groupPermissionsRepository.getGroupUser(id);
    this.groupPermissionsUtilService.validateDeleteGroupUserOperation(groupUser?.group, organizationId);
    await this.groupPermissionsRepository.removeUserFromGroup(id);
  }

  async getAddableUser(groupId: string, organizationId: string, searchInput?: string) {
    return await this.groupPermissionsRepository.addableUsersToGroup(groupId, organizationId, searchInput);
  }
}
