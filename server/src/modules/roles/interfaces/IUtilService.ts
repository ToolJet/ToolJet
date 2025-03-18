import { EntityManager } from 'typeorm';
import { EditUserRoleDto } from '../dto';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { AddUserRoleObject } from '@modules/group-permissions/types';

export interface IRolesUtilService {
  changeEndUserToEditor(
    organizationId: string,
    userIds: string[],
    endUserGroupId: string,
    manager?: EntityManager
  ): Promise<void>;

  editDefaultGroupUserRole(
    organizationId: string,
    editRoleDto: EditUserRoleDto,
    manager?: EntityManager
  ): Promise<void>;

  addUserRole(organizationId: string, addUserRoleObject: AddUserRoleObject, manager?: EntityManager): Promise<void>;

  isEditableGroup(group: GroupPermissions, organizationId: string, manager?: EntityManager): Promise<boolean>;

  checkIfBuilderLevelResourcesPermissions(
    groupId: string,
    organizationId: string,
    manager?: EntityManager
  ): Promise<boolean>;
}
