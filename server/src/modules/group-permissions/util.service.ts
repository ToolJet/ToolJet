import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  MethodNotAllowedException,
} from '@nestjs/common';
import { GroupPermissionsRepository } from './repository';
import { CreateDefaultGroupObject, GetUsersResponse } from './types';
import { ERROR_HANDLER } from './constants/error';
import {
  DEFAULT_GROUP_PERMISSIONS,
  DEFAULT_RESOURCE_PERMISSIONS,
  GROUP_PERMISSIONS_TYPE,
  HUMANIZED_USER_LIST,
  ResourceType,
  USER_ROLE,
} from './constants';
import { EntityManager, In, Not } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { AddGroupUserDto, UpdateGroupPermissionDto } from './dto';
import { GranularPermissionsUtilService } from './util-services/granular-permissions.util.service';
import { CreateResourcePermissionObject } from './types/granular_permissions';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from './constants/granular_permissions';
import { RolesUtilService } from '@modules/roles/util.service';
import { GroupUsers } from '../../entities/group_users.entity';
import { RolesRepository } from '@modules/roles/repository';
import { UserRepository } from '@modules/users/repository';
import { USER_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { IGroupPermissionsUtilService } from './interfaces/IUtilService';
import { GroupPermissionLicenseUtilService } from './util-services/license.util.service';
@Injectable()
export class GroupPermissionsUtilService implements IGroupPermissionsUtilService {
  constructor(
    protected readonly groupPermissionsRepository: GroupPermissionsRepository,
    protected readonly granularPermissionsUtilService: GranularPermissionsUtilService,
    protected readonly roleUtilService: RolesUtilService,
    protected readonly rolesRepository: RolesRepository,
    protected readonly userRepository: UserRepository,
    protected readonly licenseUtilService: GroupPermissionLicenseUtilService
  ) {}

  validateCreateGroupOperation(createGroupPermissionDto: CreateDefaultGroupObject) {
    if (HUMANIZED_USER_LIST.includes(createGroupPermissionDto.name)) {
      throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME);
    }

    if (Object.values(USER_ROLE).includes(createGroupPermissionDto.name as USER_ROLE))
      throw new BadRequestException(ERROR_HANDLER.RESERVED_KEYWORDS_FOR_GROUP_NAME);
  }

  validateAddGroupUserOperation(group: GroupPermissions) {
    if (!group || Object.keys(group)?.length === 0) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
    if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
      throw new MethodNotAllowedException(ERROR_HANDLER.ADD_GROUP_USER_DEFAULT_GROUP);
  }

  validateDeleteGroupUserOperation(group: GroupPermissions, organizationId: string) {
    if (!group || group?.organizationId !== organizationId) {
      throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
    }

    if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
      throw new MethodNotAllowedException(ERROR_HANDLER.DELETING_DEFAULT_GROUP_USER);
  }

  validateUpdateGroupOperation(group: GroupPermissions, updateGroupPermissionDto: UpdateGroupPermissionDto): void {
    const { name } = group;
    const { name: newName } = updateGroupPermissionDto;
    if (
      newName &&
      (Object.values(USER_ROLE).includes(newName as USER_ROLE) || group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    ) {
      throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME_UPDATE);
    }

    if (HUMANIZED_USER_LIST.includes(newName)) {
      throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME_UPDATE);
    }

    if ([USER_ROLE.ADMIN, USER_ROLE.END_USER].includes(name as USER_ROLE)) {
      throw new BadRequestException(ERROR_HANDLER.NON_EDITABLE_GROUP_UPDATE);
    }
  }

  async getGroupWithBuilderLevel(
    id: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }> {
    const isLicenseValid = await this.licenseUtilService.isValidLicense();
    const noLicenseFilter = { type: GROUP_PERMISSIONS_TYPE.DEFAULT };
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Get Group details

      const group = await this.groupPermissionsRepository.getGroup(
        {
          id,
          organizationId,
          ...(!isLicenseValid ? noLicenseFilter : {}),
        },
        manager
      );

      if (!isLicenseValid) {
        if (group.name !== USER_ROLE.END_USER) {
          for (const key in group) {
            if (typeof group[key] === 'boolean') {
              group[key] = true;
            }
          }
        } else {
          for (const key in group) {
            if (typeof group[key] === 'boolean') {
              group[key] = false;
            }
          }
        }
        group.disabled = true;
      }

      const isBuilderLevelMainPermissions = Object.values(group).some(
        (value) => typeof value === 'boolean' && value === true
      );

      if (isBuilderLevelMainPermissions) {
        return { group, isBuilderLevel: true };
      }

      const isBuilderLevelResourcePermissions = await this.roleUtilService.checkIfBuilderLevelResourcesPermissions(
        id,
        organizationId,
        manager
      );

      return { group, isBuilderLevel: isBuilderLevelResourcePermissions };
    }, manager);
  }

  async createDefaultGroups(organizationId: string, manager?: EntityManager): Promise<void> {
    const defaultGroups: GroupPermissions[] = [];
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Create all default group
      for (const defaultGroup of Object.keys(USER_ROLE)) {
        const newGroup = await this.groupPermissionsRepository.createGroup(
          organizationId,
          DEFAULT_GROUP_PERMISSIONS[defaultGroup],
          manager
        );
        defaultGroups.push(newGroup);
      }

      //Add granular permissions to default group
      for (const group of defaultGroups) {
        const groupGranularPermissions: Record<
          ResourceType,
          CreateResourcePermissionObject<any>
        > = DEFAULT_RESOURCE_PERMISSIONS[group.name];
        for (const resource of Object.keys(groupGranularPermissions)) {
          const createResourcePermissionObj: CreateResourcePermissionObject<any> = groupGranularPermissions[resource];

          const dtoObject = {
            name: DEFAULT_GRANULAR_PERMISSIONS_NAME[resource],
            groupId: group.id,
            type: resource as ResourceType,
            isAll: true,
            createResourcePermissionObject: {},
          };
          await this.granularPermissionsUtilService.create(
            {
              createGranularPermissionDto: dtoObject,
              organizationId,
            },
            createResourcePermissionObj,
            manager
          );
        }
      }
    }, manager);
  }

  async deleteFromAllCustomGroupUser(userId: string, organizationId: string, manager?: EntityManager): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const groupUsersToDelete = await manager.find(GroupUsers, {
        where: {
          userId: userId,
          group: {
            type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP,
            organizationId,
          },
        },
        relations: ['group'],
      });

      if (groupUsersToDelete.length > 0) {
        await manager.delete(
          GroupUsers,
          groupUsersToDelete.map((gp) => gp.id)
        );
      }
    }, manager);
  }

  async addUsersToGroup(addGroupUserDto: AddGroupUserDto, organizationId: string, manager?: EntityManager) {
    const { userIds, groupId, allowRoleChange, endUsers } = addGroupUserDto;

    // endUsers - can be passed if this function is called in a loop. Scenario -> adding a user to multiple groups

    await dbTransactionWrap(async (manager: EntityManager) => {
      const { group, isBuilderLevel } = await this.getGroupWithBuilderLevel(groupId, organizationId, manager);
      const isLicenseValid = await this.licenseUtilService.isValidLicense();

      if (!isLicenseValid && group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP) {
        // Basic plan - not allowed to update custom groups
        throw new ForbiddenException(ERROR_HANDLER.INVALID_LICENSE);
      }

      // Validation - Group exist and Group is not default group
      //this.validateAddGroupUserOperation(group);

      // Get end users
      const endUserRoleUsers = endUsers?.length
        ? endUsers
        : await this.rolesRepository.getRoleUsersList(USER_ROLE.END_USER, organizationId, userIds, manager);
      if (isBuilderLevel && endUserRoleUsers.length) {
        // Group is builder level and end users are to be added
        if (!allowRoleChange) {
          // Role change not allowed - Throw error
          throw new ConflictException({
            message: {
              error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
              data: endUserRoleUsers?.map((user) => user.email),
              title: 'Cannot add this permission to the group',
              type: 'USER_ROLE_CHANGE_ADD_USERS',
            },
          });
        }
        await this.roleUtilService.changeEndUserToEditor(
          organizationId,
          endUserRoleUsers.map((user) => user.id),
          endUserRoleUsers[0].userGroups[0].group.id,
          manager
        );
      }

      // Validate Users exist
      const users = await this.userRepository.getUsers(
        {
          id: In(userIds),
          status: Not(In([USER_STATUS.ARCHIVED])),
          organizationUsers: {
            organizationId: organizationId,
            status: Not(In([WORKSPACE_USER_STATUS.ARCHIVED])),
          },
        },
        null,
        ['organizationUsers'],
        null,
        manager
      );

      if (users?.length !== new Set(userIds).size) {
        // Some users are not present in organization
        throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);
      }

      const existingRelations = await manager.find(GroupUsers, {
        where: { groupId, userId: In(userIds) },
      });

      if (existingRelations.length === new Set(userIds).size) {
        // All users are already added
        return;
      }

      // Filtering out existing relations
      const groupUsers = userIds
        .filter((userId) => !existingRelations.some((groupUsers) => groupUsers.userId === userId))
        .map((userId) => {
          return { userId, groupId };
        });

      await manager.insert(GroupUsers, groupUsers);
    }, manager);
  }

  async getAllGroupByOrganization(organizationId: string): Promise<GetUsersResponse> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const isLicenseValid = await this.licenseUtilService.isValidLicense();
      const result = await manager.findAndCount(GroupPermissions, {
        where: { organizationId },
        order: { type: 'DESC' },
      });
      const response: GetUsersResponse = {
        groupPermissions: result[0],
        length: result[1],
      };
      if (!isLicenseValid) {
        response.groupPermissions?.forEach((gp) => {
          if (gp.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP) {
            gp.disabled = true;
          }
        });
      }
      return response;
    });
  }
}
