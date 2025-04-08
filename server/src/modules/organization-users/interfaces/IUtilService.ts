import { User } from '@entities/user.entity';
import { EntityManager } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { InviteNewUserDto } from '@modules/organization-users/dto/invite-new-user.dto';
import { OrganizationUser } from '@entities/organization_user.entity';
import { RoleUpdate, FetchUserResponse, UserFilterOptions, InvitedUserType } from '../types';

export interface IOrganizationUsersUtilService {
  updateUserMetadata(manager: EntityManager, userId: string, organizationId: string, userMetadata: any): Promise<void>;
  updateUserDetails(userId: string, basicDetails: Partial<User>, manager?: EntityManager): Promise<void>;
  handleGroupsAndRoleChanges(
    user: Partial<User>,
    organizationId: string,
    roleUpdateObj: RoleUpdate,
    manager: EntityManager
  ): Promise<void>;
  attachUserGroup(groups: string[], organizationId: string, userId: string, manager?: EntityManager): Promise<void>;
  updateUserStatus(userId: string, status: string, manager?: EntityManager): Promise<void>;
  findInvitingUserByEmail(email: string, manager?: EntityManager): Promise<User>;
  validateInvitingUser(email: string, organizationId: string, manager: EntityManager): Promise<User>;
  createDefaultOrganization(manager: EntityManager): Promise<Organization>;
  addUserAsAdmin(userId: string, organizationId: string, manager: EntityManager): Promise<void>;
  createOrUpdateUser(
    userParams: Partial<User>,
    existingUser: User,
    defaultOrganizationId: string,
    manager: EntityManager
  ): Promise<User>;
  sendWelcomeEmail(
    user: User,
    organizationUser: OrganizationUser,
    organization: Organization,
    inviterName: string,
    isNewUser: boolean
  ): Promise<void>;
  activateOrganization(organizationUser: OrganizationUser, manager?: EntityManager): Promise<void>;
  personalWorkspaceCount(userId: string): Promise<number>;
  personalWorkspaces(userId: string): Promise<OrganizationUser[]>;
  getUser(token: string): Promise<OrganizationUser>;
  prepareUserParams(inviteNewUserDto: InviteNewUserDto): Partial<User>;
  checkPersonalWorkspaceAllowed(): Promise<boolean>;
  isAllWorkspacesArchivedBySuperAdmin(userId: string): Promise<boolean>;
  fetchUsers(
    user: User,
    options: UserFilterOptions,
    page?: number
  ): Promise<{ organizationUsers: FetchUserResponse[]; total: number }>;
  inviteUserswrapper(users: any[], currentUser: User): Promise<void>;
  inviteNewUser(
    currentUser: User,
    inviteNewUserDto: InviteNewUserDto,
    manager?: EntityManager
  ): Promise<OrganizationUser>;
  createGroupsList(groups: string): string[];
  convertUserRolesCasing(role: string): string;
  throwErrorIfUserIsLastActiveAdmin(user: User, organizationId: string): Promise<void>;
  findByWorkspaceInviteToken(invitationToken: string): Promise<InvitedUserType>;
}
