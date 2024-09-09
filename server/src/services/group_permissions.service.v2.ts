import { Injectable, BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import {
  UpdateGroupPermissionDto,
  CreateGroupPermissionDto,
  AddGroupUserDto,
  DuplicateGroupDto,
} from '@dto/group_permissions.dto';
import { User } from 'src/entities/user.entity';
import {
  USER_ROLE,
  ERROR_HANDLER,
  DATA_BASE_CONSTRAINTS,
  GROUP_PERMISSIONS_TYPE,
} from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { catchDbException } from 'src/helpers/utils.helper';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import {
  CreateDefaultGroupObject,
  DuplicateGroupObject,
  GetGroupUsersObject,
  GetUsersResponse,
  UpdateGroupObject,
} from '@modules/user_resource_permissions/interface/group-permissions.interface';
import { GroupUsers } from 'src/entities/group_users.entity';
import {
  getAllUserGroupsQuery,
  getUserDetailQuery,
  getUserInGroupQuery,
  validateAddGroupUserOperation,
  validateUpdateGroupOperation,
} from '@modules/user_resource_permissions/utility/group-permissions.utility';
import { GroupPermissionsUtilityService } from '@modules/user_resource_permissions/services/group-permissions.utility.service';
import { getAllGranularPermissionQuery } from '@modules/user_resource_permissions/utility/granular-permissios.utility';
const _ = require('lodash');

@Injectable()
export class GroupPermissionsServiceV2 {
  constructor(private groupPermissionsUtilityService: GroupPermissionsUtilityService) {}

  /**
   * Creates a new group permission for a specified organization.
   *
   * @param organizationId The ID of the organization for which the group permission is being created.
   * @param createGroupObject An object containing the data to create the new group permission.
   * @returns A Promise that resolves when the group permission is successfully created.
   * @throws BadRequestException if the group name already exists in the USER_ROLE enum.
   */
  async create(
    organizationId: string,
    createGroupObject: CreateGroupPermissionDto | CreateDefaultGroupObject,
    manager?: EntityManager
  ): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await catchDbException(async () => {
        const group = manager.create(GroupPermissions, { ...createGroupObject, organizationId });
        return await manager.save(group);
      }, [DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE]);
    }, manager);
  }

  async getAllGroup(organizationId: string): Promise<GetUsersResponse> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const result = await manager.findAndCount(GroupPermissions, {
        where: { organizationId },
        order: { type: 'DESC' },
      });
      const response: GetUsersResponse = {
        groupPermissions: result[0],
        length: result[1],
      };
      return response;
    });
  }

  async getGroup(
    organizationId: string,
    id: string,
    manager?: EntityManager
  ): Promise<{ group: GroupPermissions; isBuilderLevel: boolean }> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const [group, isBuilderLevelResourcePermissions] = await Promise.all([
        manager.findOne(GroupPermissions, {
          where: { id, organizationId },
        }),
        await this.groupPermissionsUtilityService.checkIfBuilderLevelResourcesPermissions(id, manager),
      ]);
      const isBuilderLevelMainPermissions = Object.values(group).some(
        (value) => typeof value === 'boolean' && value === true
      );
      const isBuilderLevel = isBuilderLevelResourcePermissions || isBuilderLevelMainPermissions;
      return { group, isBuilderLevel };
    }, manager);
  }

  async updateGroup(
    updateGroupObject: UpdateGroupObject,
    updateGroupPermissionDto: UpdateGroupPermissionDto,
    manager?: EntityManager
  ) {
    const { id, organizationId } = updateGroupObject;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { group } = await this.getGroup(organizationId, id);
      if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);

      validateUpdateGroupOperation(group, updateGroupPermissionDto);
      const { allowRoleChange } = updateGroupPermissionDto;
      delete updateGroupPermissionDto.allowRoleChange;
      const keys = Object.keys(updateGroupPermissionDto);
      const validatePermissionsUpdate = !(keys.length === 1 && keys.includes('name'));
      const editPermissionsPresent = Object.keys(updateGroupPermissionDto).some(
        (value) => typeof updateGroupPermissionDto?.[value] === 'boolean' && updateGroupPermissionDto?.[value] === true
      );
      if (validatePermissionsUpdate) {
        const getEndUsersList = await this.groupPermissionsUtilityService.getRoleUsersList(
          USER_ROLE.END_USER,
          group.organizationId,
          group.id
        );

        if (getEndUsersList.length && editPermissionsPresent) {
          if (!allowRoleChange) {
            throw new MethodNotAllowedException({
              message: {
                error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
                data: getEndUsersList?.map((user) => user.email),
                title: 'Cannot add this permission to the group',
                type: 'USER_ROLE_CHANGE',
              },
            });
          }
          await Promise.all(
            getEndUsersList.map(async (userItem) => {
              const currentRoleUser = userItem.userGroups[0].id;
              const roleGroup = await this.groupPermissionsUtilityService.getRoleGroup(
                USER_ROLE.BUILDER,
                group.organizationId,
                manager
              );
              await this.deleteGroupUser(currentRoleUser, manager);
              const newUserRole = manager.create(GroupUsers, { groupId: roleGroup.id, userId: userItem.id });
              await manager.save(newUserRole);
            })
          );
        }
      }
      return await catchDbException(async () => {
        await manager.update(GroupPermissions, id, updateGroupPermissionDto);
      }, [DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE]);
    }, manager);
  }

  async deleteGroup(id: string, organizationId: string): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { group } = await this.getGroup(organizationId, id, manager);
      if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
        throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_UPDATE_NOT_ALLOWED);
      return await manager.delete(GroupPermissions, id);
    });
  }

  private async createGroupUser(user: User, group: GroupPermissions, manager?: EntityManager): Promise<GroupUsers> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await catchDbException(async () => {
        const groupUser = manager.create(GroupUsers, { groupId: group.id, userId: user.id });
        return await manager.save(groupUser);
      }, [DATA_BASE_CONSTRAINTS.GROUP_USER_UNIQUE]);
    }, manager);
  }

  async getAllGroupUsers(
    getGroupUsersObject: GetGroupUsersObject,
    searchInput?: string,
    manager?: EntityManager
  ): Promise<GroupUsers[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getUserInGroupQuery(getGroupUsersObject, manager, searchInput).getMany();
    }, manager);
  }

  async getGroupUser(id: string, manager?: EntityManager): Promise<GroupUsers> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(GroupUsers, {
        where: {
          id,
        },
        relations: ['group'],
      });
    }, manager);
  }

  async getAllUserGroups(userId: string, organizationId: string, manager?: EntityManager): Promise<GroupPermissions[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getAllUserGroupsQuery(userId, organizationId, manager).getMany();
    }, manager);
  }

  async deleteGroupUser(id: string, manager?: EntityManager): Promise<GroupUsers> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.delete(GroupUsers, id);
    }, manager);
  }

  async addGroupUsers(addGroupUserDto: AddGroupUserDto, organizationId: string, manager?: EntityManager) {
    const { userIds, groupId, allowRoleChange } = addGroupUserDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { group, isBuilderLevel } = await this.getGroup(organizationId, groupId, manager);
      validateAddGroupUserOperation(group);
      const editorRoleUsers = await this.groupPermissionsUtilityService.getRoleUsersList(
        USER_ROLE.END_USER,
        organizationId,
        null,
        manager
      );
      const editorUsersToBeAdded = editorRoleUsers.filter((user) => userIds.includes(user.id));
      if (isBuilderLevel && editorUsersToBeAdded.length) {
        if (!allowRoleChange) {
          throw new MethodNotAllowedException({
            message: {
              error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
              data: editorUsersToBeAdded?.map((user) => user.email),
              title: 'Cannot add this permission to the group',
              type: 'USER_ROLE_CHANGE_ADD_USERS',
            },
          });
        }
        await Promise.all(
          editorUsersToBeAdded.map(async (userItem) => {
            const currentRoleUser = userItem.userGroups[0].id;
            const roleGroup = await this.groupPermissionsUtilityService.getRoleGroup(
              USER_ROLE.BUILDER,
              organizationId,
              manager
            );
            await this.deleteGroupUser(currentRoleUser, manager);
            const newUserRole = manager.create(GroupUsers, { groupId: roleGroup.id, userId: userItem.id });
            await manager.save(newUserRole);
          })
        );
      }
      return await Promise.all(
        userIds.map(async (userId) => {
          const user = await getUserDetailQuery(userId, organizationId, manager).getOne();
          if (!user) throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);
          return await this.createGroupUser(user, group, manager);
        })
      );
    }, manager);
  }

  async duplicateGroup(
    duplicateGroupObject: DuplicateGroupObject,
    duplicateGroupDto: DuplicateGroupDto,
    manager?: EntityManager
  ): Promise<GroupPermissions> {
    const { addApps, addPermission, addUsers } = duplicateGroupDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { groupId, organizationId } = duplicateGroupObject;
      const { group } = await this.getGroup(organizationId, groupId, manager);
      if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
      const newGroup = await this.groupPermissionsUtilityService.duplicateGroup(group, addPermission, manager);
      if (addUsers) {
        const groupUsers = await this.getAllGroupUsers(
          { groupId, organizationId: group.organizationId },
          null,
          manager
        );
        await Promise.all(
          groupUsers.map(async (groupUser) => {
            await this.createGroupUser(groupUser.user, newGroup, manager);
          })
        );
      }
      if (addApps) {
        const allGranularPermissions = await getAllGranularPermissionQuery({ groupId }, manager).getMany();
        await Promise.all(
          allGranularPermissions.map(async (permissions) => {
            //Deep cloning here cause the object will be updated in the function
            const permissionsToDuplicate = _.cloneDeep(permissions);
            const granularPermission = await this.groupPermissionsUtilityService.duplicateGranularPermissions(
              permissionsToDuplicate,
              newGroup.id,
              manager
            );
            await this.groupPermissionsUtilityService.duplicateResourcePermissions(
              permissions,
              granularPermission.id,
              manager
            );
          })
        );
      }
      return newGroup;
    }, manager);
  }
}
