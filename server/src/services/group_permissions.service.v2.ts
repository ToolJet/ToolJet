import { Injectable, BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { UpdateGroupPermissionDto, CreateGroupPermissionDto } from '@dto/group_permissions.dto';
import { User } from 'src/entities/user.entity';
import {
  USER_ROLE,
  ERROR_HANDLER,
  DATA_BASE_CONSTRAINTS,
  DEFAULT_GROUP_PERMISSIONS,
  GROUP_PERMISSIONS_TYPE,
} from '@module/group_permissions/constants/group-permissions.constant';
import { dbTransactionWrap, catchDbException } from 'src/helpers/utils.helper';
import { EntityManager, getManager } from 'typeorm';
import {
  CreateDefaultGroupObject,
  GroupQuerySearchParamObject,
} from '@module/group_permissions/interface/group-permissions.interface';
import { createWhereConditions } from '@helpers/db-utility/db-search.helper';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GranularPermissionsService } from './granular_permissions.service';
import {
  DEFAULT_GRANULAR_PERMISSIONS_NAME,
  ResourceType,
} from '@module/group_permissions/constants/granular-permissions.constant';

@Injectable()
export class GroupPermissionsServiceV2 {
  constructor(private granularPermissionsService: GranularPermissionsService) {}

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
    createGroupObject: CreateGroupPermissionDto | CreateDefaultGroupObject
  ): Promise<GroupPermissions> {
    this.defaultGroupCheck(createGroupObject);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await catchDbException(async () => {
        const group = manager.create(GroupPermissions, { ...createGroupObject, organizationId });
        return await manager.save(group);
      }, [DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE]);
    });
  }

  async createDefaultGroups(user: User): Promise<void> {
    const { organizationId } = user;

    const defaultGroups: GroupPermissions[] = [];

    // Create all default groups
    for (const defaultGroup of Object.keys(USER_ROLE)) {
      const newGroup = await this.create(organizationId, DEFAULT_GROUP_PERMISSIONS[defaultGroup]);
      defaultGroups.push(newGroup);
    }

    //Add admin user to default group
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await this.addUserToRole(manager, user, USER_ROLE.ADMIN);

      //Add granular permissions to default group
      for (const group of defaultGroups) {
        const isOnlyBuilder = group.onlyBuilders;
        const granularPermissions = await this.granularPermissionsService.create(manager, {
          name: DEFAULT_GRANULAR_PERMISSIONS_NAME.APPS,
          groupId: group.id,
          type: ResourceType.APP,
        });
        await this.granularPermissionsService.createResourceGroupPermission(
          manager,
          isOnlyBuilder,
          granularPermissions
        );
      }
    });
  }

  defaultGroupCheck(groupObject: GroupPermissions | CreateGroupPermissionDto | UpdateGroupPermissionDto) {
    if (groupObject.name in USER_ROLE) throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_NAME);
  }

  async deleteGroup(id: string): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.getGroup(id, manager);
      if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
        throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_UPDATE_NOT_ALLOWED);
      return await manager.delete(GroupPermissions, id);
    });
  }

  //Need more work
  async updateGroup(id: string, updateGroupPermissionDto: UpdateGroupPermissionDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.getGroup(id, manager);
      const { editable } = group;
      //add complex logic for only builder
      // this.validateUpdatePermissions(onlyBuilders,updateGroupPermissionDto);
      if (!editable) throw new MethodNotAllowedException(ERROR_HANDLER.NON_EDITABLE_GROUP_UPDATE);

      return await manager.delete(GroupPermissions, id);
    });
    //Is editable only in paid plan builder group
  }

  //Need more work
  validateUpdatePermissions(isOnlyBuilder, updateGroupPermissionDto: UpdateGroupPermissionDto) {
    const trueValues = Object.keys(updateGroupPermissionDto).filter(
      (key) => key != 'name' && updateGroupPermissionDto[key]
    );
    if (!isOnlyBuilder && trueValues.length > 1)
      throw new BadRequestException(ERROR_HANDLER.NON_BUILDER_PERMISSION_UPDATE);
  }

  async getGroup(
    id: string,
    manager?: EntityManager,
    searchParam?: GroupQuerySearchParamObject
  ): Promise<GroupPermissions> {
    const entityManager: EntityManager = manager ? manager : getManager();
    const whereConditions = createWhereConditions(searchParam);
    return await entityManager.findOne(GroupPermissions, {
      where: { id, ...whereConditions },
    });
  }

  async getRoleGroup(manager: EntityManager, role: USER_ROLE, organizationId: string) {
    return await manager.findOne(GroupPermissions, {
      where: { name: role, organizationId, type: GROUP_PERMISSIONS_TYPE.DEFAULT },
    });
  }
  async getAllGroup(organizationId: string) {
    const manager: EntityManager = getManager();
    return await manager.findAndCount(GroupPermissions, {
      where: { organizationId },
    });
  }

  //Need work for group updation
  async addGroupUser(groupId: string, userId: string) {
    //Add complex logic of only builder\
  }

  //Need for for group updation
  private async createGroupUser(manager: EntityManager, user: User, group: GroupPermissions): Promise<GroupUsers> {
    //update only builder
    const groupUser = manager.create(GroupUsers, { groupId: group.id, userId: user.id });
    return await manager.save(groupUser);
  }

  async deleteGroupUser(groupId: string, organizationId: string) {
    //update only builder
  }

  async getAllGroupUser(manager: EntityManager, groupId: string) {}

  async editDefaultGroupUserRole(user: User, currentRole: USER_ROLE, newRole: USER_ROLE) {}

  private async addUserToRole(manager: EntityManager, user: User, role: USER_ROLE) {
    const { organizationId } = user;
    const adminGroup = await this.getRoleGroup(manager, role, organizationId);
    return await this.createGroupUser(manager, user, adminGroup);
  }
}
