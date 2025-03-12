import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { InferSubjects, Ability } from '@casl/ability';
import { ORGANIZATION_RESOURCE_ACTIONS } from 'src/constants/global.constant';

type Actions =
  | ORGANIZATION_RESOURCE_ACTIONS.EDIT_ROLE
  | ORGANIZATION_RESOURCE_ACTIONS.USER_ARCHIVE
  | ORGANIZATION_RESOURCE_ACTIONS.USER_INVITE
  | ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS
  | ORGANIZATION_RESOURCE_ACTIONS.UPDATE
  | ORGANIZATION_RESOURCE_ACTIONS.UPDATE_USERS
  | ORGANIZATION_RESOURCE_ACTIONS.VIEW_ALL_USERS
  | ORGANIZATION_RESOURCE_ACTIONS.CONFIGURE_GIT_SYNC
  | 'changeRole'
  | 'archiveUser'
  | 'inviteUser'
  | 'accessGroupPermission'
  | 'createGroupPermission'
  | 'deleteGroupPermission'
  | 'updateGroupPermission'
  | 'accessAuditLogs'
  | 'updateOrganizations'
  | 'updateGroupUserPermission'
  | 'updateGroupAppPermission'
  | 'updateGroupDataSourcePermission'
  | 'updateUser'
  | 'viewAllUsers';

type Subjects = InferSubjects<typeof OrganizationUser | typeof User> | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
