import { Injectable, BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { UpdateGroupPermissionDto, CreateGroupPermissionDto, AddGroupUserDto } from '@dto/group_permissions.dto';
import { User } from 'src/entities/user.entity';
import {
  USER_ROLE,
  ERROR_HANDLER,
  DATA_BASE_CONSTRAINTS,
  GROUP_PERMISSIONS_TYPE,
} from '@module/user_resource_permissions/constants/group-permissions.constant';
import { dbTransactionWrap, catchDbException } from 'src/helpers/utils.helper';
import { EntityManager, getManager } from 'typeorm';
import {
  CreateDefaultGroupObject,
  GetUsersResponse,
} from '@module/user_resource_permissions/interface/group-permissions.interface';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GranularPermissionsService } from './granular_permissions.service';
import {
  getAllUserGroupsQuery,
  getUserDetailQuery,
  getUserInGroupQuery,
  validateAddGroupUserOperation,
  validateUpdateGroupOperation,
} from '@module/user_resource_permissions/utility/group-permissions.utility';
import { GroupPermissionsUtilityService } from '@module/user_resource_permissions/services/group-permissions.utility.service';
import { ResourceType } from '@module/user_resource_permissions/constants/granular-permissions.constant';

@Injectable()
export class GroupPermissionsServiceV2 {
  constructor(
    private granularPermissionsService: GranularPermissionsService,
    private groupPermissionsUtilityService: GroupPermissionsUtilityService
  ) {}

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
    const manager: EntityManager = getManager();
    const result = await manager.findAndCount(GroupPermissions, {
      where: { organizationId },
      order: { type: 'DESC' },
    });
    const response: GetUsersResponse = {
      groupPermissions: result[0],
      length: result[1],
    };
    return response;
  }

  async getGroup(id: string, manager?: EntityManager): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(GroupPermissions, {
        where: { id },
      });
    }, manager);
  }

  async updateGroup(id: string, updateGroupPermissionDto: UpdateGroupPermissionDto, manager?: EntityManager) {
    //License level validation at controller level
    const group = await this.getGroup(id);
    if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);

    validateUpdateGroupOperation(group, updateGroupPermissionDto);

    const keys = Object.keys(updateGroupPermissionDto);
    const validatePermissionsUpdate = !(keys.length === 1 && keys.includes('name'));
    const editPermissionsPresent = Object.values(updateGroupPermissionDto).some(
      (value) => typeof value === 'boolean' && value === true
    );
    console.log('running till here');

    if (validatePermissionsUpdate) {
      const getEndUsersList = await this.groupPermissionsUtilityService.getRoleUsersList(
        USER_ROLE.END_USER,
        group.organizationId,
        group.id
      );

      if (getEndUsersList.length && editPermissionsPresent) {
        throw new MethodNotAllowedException({
          message: {
            error: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
            data: getEndUsersList?.map((user) => user.email),
            title: 'Cannot add this permissions to the group',
          },
        });
      }
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await catchDbException(async () => {
        await manager.update(GroupPermissions, id, updateGroupPermissionDto);
      }, [DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE]);
    }, manager);
  }

  async deleteGroup(id: string): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.getGroup(id, manager);
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

  async getAllGroupUsers(groupId: string, searchInput?: string, manager?: EntityManager): Promise<GroupUsers[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await getUserInGroupQuery(groupId, manager, searchInput).getMany();
    }, manager);
  }

  async getGroupUser(id: string, manager?: EntityManager): Promise<GroupUsers> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(GroupUsers, id, {
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
    const { userIds, groupId } = addGroupUserDto;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.getGroup(groupId, manager);
      const granularPermission = await this.granularPermissionsService.getAll({ groupId: group.id }, manager);
      validateAddGroupUserOperation(group);

      return await Promise.all(
        userIds.map(async (userId) => {
          const user = await getUserDetailQuery(userId, organizationId, manager).getOne();
          if (!user) throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);

          const role = await this.groupPermissionsUtilityService.getUserRole(userId, organizationId, manager);
          const editPermissionsPresent =
            Object.values(group).some((value) => typeof value === 'boolean' && value === true) ||
            granularPermission.some((value) => {
              return value.type === ResourceType.APP && value.appsGroupPermissions.canEdit;
            });

          if (editPermissionsPresent && role.name == USER_ROLE.END_USER) {
            throw new MethodNotAllowedException({
              message: {
                error: ERROR_HANDLER.GROUP_USERS_EDITABLE_GROUP_ADDITION(user.email),
                title: 'Can not add end user to this group',
              },
            });
          }

          return await this.createGroupUser(user, group, manager);
        })
      );
    }, manager);
  }
}
