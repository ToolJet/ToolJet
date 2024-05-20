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
import { CreateDefaultGroupObject } from '@module/user_resource_permissions/interface/group-permissions.interface';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GranularPermissionsService } from './granular_permissions.service';
import {
  getAllUserGroupsQuery,
  getUserDetailQuery,
  validateAddGroupUserOperation,
  validateDeleteGroupUserOperation,
  validateUpdateGroupOperation,
} from '@module/user_resource_permissions/utility/group-permissions.utility';
import { GroupPermissionsUtilityService } from '@module/user_resource_permissions/services/group-permissions.utility.service';

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

  async getAllGroup(organizationId: string) {
    const manager: EntityManager = getManager();
    return await manager.findAndCount(GroupPermissions, {
      where: { organizationId },
      order: { type: 'DESC' },
    });
  }

  async getGroup(id: string, manager?: EntityManager): Promise<GroupPermissions> {
    const entityManager: EntityManager = manager ? manager : getManager();
    return await entityManager.findOne(GroupPermissions, {
      where: { id },
    });
  }

  async updateGroup(id: string, updateGroupPermissionDto: UpdateGroupPermissionDto, manager?: EntityManager) {
    //License level validation at controller level

    const group = await this.getGroup(id);
    if (!group) throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);

    validateUpdateGroupOperation(group, updateGroupPermissionDto);
    const getEndUsersList = await this.groupPermissionsUtilityService.getRoleUsersList(
      USER_ROLE.END_USER,
      group.organizationId,
      group.id
    );
    const editPermissionsPresent = Object.values(updateGroupPermissionDto).some(
      (value) => typeof value === 'boolean' && value === true
    );

    if (getEndUsersList.length && editPermissionsPresent) {
      throw new MethodNotAllowedException({
        message: ERROR_HANDLER.UPDATE_EDITABLE_PERMISSION_END_USER_GROUP,
        data: getEndUsersList,
      });
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

  async getAllGroupUsers(groupId: string): Promise<GroupUsers[]> {
    const manager: EntityManager = getManager();
    return await manager.find(GroupUsers, {
      where: {
        groupId,
      },
      relations: ['user'],
    });
  }

  async getAllUserGroups(userId: string, organizationId: string): Promise<GroupUsers[]> {
    return await getAllUserGroupsQuery(userId, organizationId).getMany();
  }

  async deleteGroupUser(id: string, manager?: EntityManager): Promise<GroupUsers> {
    const group = await this.getGroup(id);
    validateDeleteGroupUserOperation(group);
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.delete(GroupUsers, id);
    }, manager);
  }

  async addGroupUser(addGroupUserDto: AddGroupUserDto, organizationId: string) {
    const { userId, groupId } = addGroupUserDto;
    const user = await getUserDetailQuery(userId, organizationId).getOne();
    const group = await this.getGroup(groupId);
    validateAddGroupUserOperation(group, user);

    const role = await this.groupPermissionsUtilityService.getUserRole(userId, organizationId);
    const editPermissionsPresent = Object.values(group).some((value) => typeof value === 'boolean' && value === true);
    //NEED TO CHECK FOR EDITOR LEVEL PERMISSION IN GRANULAR PERMISSIONS

    if (editPermissionsPresent && role.name == USER_ROLE.END_USER) {
      throw new MethodNotAllowedException(ERROR_HANDLER.GROUP_USERS_EDITABLE_GROUP_ADDITION(user));
    }

    return await this.createGroupUser(user, group);
  }
}
