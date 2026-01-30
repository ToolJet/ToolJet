import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { GroupPermissionsRepository } from './repository';
import { CreateDefaultGroupObject, GetUsersResponse } from './types';
import { DATA_BASE_CONSTRAINTS, ERROR_HANDLER } from './constants/error';
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
import { UserRepository } from '@modules/users/repositories/repository';
import { USER_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { IGroupPermissionsUtilService } from './interfaces/IUtilService';
import { GroupPermissionLicenseUtilService } from './util-services/license.util.service';
import { catchDbException, getTooljetEdition } from '@helpers/utils.helper';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY, TOOLJET_EDITIONS } from '@modules/app/constants';
import { User } from '@entities/user.entity';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { RequestContext } from '@modules/request-context/service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

@Injectable()
export class GroupPermissionsUtilService implements IGroupPermissionsUtilService {
  constructor(
    protected readonly groupPermissionsRepository: GroupPermissionsRepository,
    protected readonly granularPermissionsUtilService: GranularPermissionsUtilService,
    protected readonly roleUtilService: RolesUtilService,
    protected readonly rolesRepository: RolesRepository,
    protected readonly userRepository: UserRepository,
    protected readonly licenseUtilService: GroupPermissionLicenseUtilService,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly licenseTermsService: LicenseTermsService
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
    //commented out the default group check because for enable signup cases, user is added to default admin group
    // if (group.type == GROUP_PERMISSIONS_TYPE.DEFAULT)
    //   throw new MethodNotAllowedException(ERROR_HANDLER.ADD_GROUP_USER_DEFAULT_GROUP);
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
    // Check if plan is restricted (basic/starter have read-only permissions)
    const isRestrictedPlan = await this.licenseUtilService.isRestrictedPlan(organizationId);
    const restrictedPlanFilter = { type: GROUP_PERMISSIONS_TYPE.DEFAULT };
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Get Group details

      const group = await this.groupPermissionsRepository.getGroup(
        {
          id,
          organizationId,
          ...(isRestrictedPlan ? restrictedPlanFilter : {}),
        },
        manager
      );

      if (!group) {
        throw new BadRequestException(ERROR_HANDLER.GROUP_NOT_EXIST);
      }

      // For restricted plans (basic/starter), override with hardcoded permissions
      if (isRestrictedPlan) {
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

    // Check if multi-environment feature is available
    const hasMultiEnvironment = await this.licenseTermsService.getLicenseTerms(
      LICENSE_FIELD.MULTI_ENVIRONMENT,
      organizationId
    );

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
          if (getTooljetEdition() === TOOLJET_EDITIONS.CE && resource == ResourceType.WORKFLOWS) continue;
          let createResourcePermissionObj: CreateResourcePermissionObject<any> = groupGranularPermissions[resource];

          // For builder role APP permissions: set production access based on license
          // If multi-environment is NOT available (basic plan/invalid license), enable production
          // If multi-environment IS available (valid license), disable production (security)
          if (group.name === USER_ROLE.BUILDER && resource === ResourceType.APP) {
            const shouldEnableProduction = hasMultiEnvironment !== true;
            createResourcePermissionObj = {
              ...createResourcePermissionObj,
              canAccessProduction: shouldEnableProduction,
            };
          }

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
      const isLicenseValid = await this.licenseUtilService.isValidLicense(organizationId);

      if (!isLicenseValid && group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP) {
        // Basic plan - not allowed to update custom groups
        throw new ForbiddenException(ERROR_HANDLER.INVALID_LICENSE);
      }

      // Validation - Group exist and Group is not default group
      this.validateAddGroupUserOperation(group);

      // Get end users
      const endUserRoleUsers = endUsers?.length
        ? endUsers
        : await this.rolesRepository.getRoleUsersList(USER_ROLE.END_USER, organizationId, userIds, manager);

      // Check for builder-level environment permissions
      const hasBuilderEnvironments = await this.roleUtilService.checkIfBuilderLevelEnvironmentPermissions(
        groupId,
        organizationId,
        manager
      );

      if ((isBuilderLevel || hasBuilderEnvironments) && endUserRoleUsers.length) {
        // Group has builder-level permissions or environment access and end users are to be added
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
      const isFeatureEnabled = await this.licenseUtilService.isFeatureEnabled(organizationId);
      const result = await manager.findAndCount(GroupPermissions, {
        where: { organizationId },
        order: { type: 'DESC' },
      });
      const response: GetUsersResponse = {
        groupPermissions: result[0],
        length: result[1],
      };
      if (!isFeatureEnabled) {
        response.groupPermissions?.forEach((gp) => {
          if (gp.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP) {
            gp.disabled = true;
          }
        });
      }
      return response;
    });
  }
  async updateGroup(
    id: string,
    user: User,
    updateGroupPermissionDto: UpdateGroupPermissionDto,
    manager?: EntityManager
  ): Promise<any> {
    return await dbTransactionWrap(async (manager) => {
      const organizationId = user.organizationId;
      const group = await this.groupPermissionsRepository.getGroup({ id, organizationId }, manager);
      // License validation - Update not allowed on basic plan
      const isLicenseValid = await this.licenseUtilService.isValidLicense(organizationId);
      if (!isLicenseValid && group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP) {
        throw new ForbiddenException(ERROR_HANDLER.INVALID_LICENSE);
      }

      // Check if name is reserved
      this.validateUpdateGroupOperation(group, updateGroupPermissionDto);

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
          const endUsersList = await this.rolesRepository.getRoleUsersList(
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
      await this.licenseUserService.validateUser(manager, organizationId);
      //GROUP_PERMISSION_UPDATE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: group.id,
        resourceName: group.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    }, manager);
  }

  async create(user: User, name: string, manager?: EntityManager): Promise<GroupPermissions> {
    const groupCreateObj: CreateDefaultGroupObject = { name };
    this.validateCreateGroupOperation(groupCreateObj);
    const groupPermissionResponse = await this.groupPermissionsRepository.createGroup(
      user.organizationId,
      groupCreateObj,
      manager
    );
    return groupPermissionResponse;
  }

  async deleteGroup(id: string, user: User, manager?: EntityManager): Promise<void> {
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
    }, manager);
  }

  async deleteGroupUser(id: string, user: User, manager?: EntityManager): Promise<void> {
    const organizationId = user.organizationId;
    await dbTransactionWrap(async (manager: EntityManager) => {
      const groupUser = await this.groupPermissionsRepository.getGroupUser(id, manager);
      this.validateDeleteGroupUserOperation(groupUser?.group, organizationId);
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

  async getGroupWithName(name: string, organizationId: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const group = await this.groupPermissionsRepository.getGroup(
        {
          name,
          organizationId,
        },
        manager
      );
      return group;
    }, manager);
  }
  async getGroupUsers(groupIds: string[], organizationId: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const groupUsers = await manager
        .createQueryBuilder(GroupUsers, 'groupUser')
        .innerJoinAndSelect('groupUser.user', 'user')
        .innerJoin(GroupPermissions, 'group', 'group.id = groupUser.groupId')
        .where('group.id IN (:...groupIds)', { groupIds })
        .andWhere('group.organizationId = :organizationId', { organizationId })
        .select(['groupUser.groupId AS groupId', 'groupUser.userId AS userId', 'user.email AS userName'])
        .getRawMany();

      return groupUsers;
      // Example:
      // [
      //   { groupId: 'group-1', userId: 'user-1', userName: 'user1@example.com' },
      //   { groupId: 'group-2', userId: 'user-2', userName: 'user2@example.com' }
      // ]
    }, manager);
  }

  async deleteMultipleGroupUsers(
    groupId: string,
    userIds: string[],
    organizationId: string,
    manager?: EntityManager
  ): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const groupUsersRepo = manager.getRepository(GroupUsers);

      // Check group validity once
      const group = await manager.getRepository(GroupPermissions).findOne({
        where: { id: groupId },
      });
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      this.validateDeleteGroupUserOperation(group, organizationId);

      // 🧹 Delete multiple users (if userIds provided)
      if (userIds && userIds.length > 0) {
        await groupUsersRepo
          .createQueryBuilder()
          .delete()
          .from(GroupUsers)
          .where('group_id = :groupId', { groupId })
          .andWhere('user_id IN (:...userIds)', { userIds })
          .execute();
      } else {
        // 🧹 Delete all users from the group
        await groupUsersRepo
          .createQueryBuilder()
          .delete()
          .from(GroupUsers)
          .where('group_id = :groupId', { groupId })
          .execute();
      }
    }, manager);
  }
  async renameGroup(
    groupId: string,
    organizationId: string,
    newName: string,
    manager?: EntityManager
  ): Promise<GroupPermissions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // 1️⃣ Fetch group
      const group = await manager.findOne(GroupPermissions, {
        where: { id: groupId, organizationId },
      });

      if (!group) {
        throw new NotFoundException(`Group not found for id: ${groupId}`);
      }

      // 2️⃣ Validate rename operation
      const updateDto = { name: newName } as Partial<UpdateGroupPermissionDto>;
      this.validateUpdateGroupOperation(group, updateDto as UpdateGroupPermissionDto);

      // 3️⃣ Update and save
      group.name = newName;
      await manager.save(GroupPermissions, group);

      return group;
    }, manager);
  }
}
