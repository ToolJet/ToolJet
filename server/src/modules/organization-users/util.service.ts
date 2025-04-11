import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { fullName, generateNextNameAndSlug } from '@helpers/utils.helper';
import { EntityManager } from 'typeorm';
import {
  getUserStatusAndSource,
  lifecycleEvents,
  USER_STATUS,
  USER_TYPE,
  WORKSPACE_USER_STATUS,
} from '@modules/users/constants/lifecycle';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Organization } from '@entities/organization.entity';
import { InviteNewUserDto } from '@modules/organization-users/dto/invite-new-user.dto';
import { OrganizationUser } from '@entities/organization_user.entity';
import { EMAIL_EVENTS } from '@modules/email/constants';
import { OrganizationUsersRepository } from './repository';
import { RolesUtilService } from '../roles/util.service';
import { LicenseUserService } from '../licensing/services/user.service';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '../group-permissions/constants';
import { ConfigService } from '@nestjs/config';
import { LicenseTermsService } from '../licensing/interfaces/IService';
import { LICENSE_FIELD } from '../licensing/constants';
import { GroupPermissionsUtilService } from '../group-permissions/util.service';
import { RolesRepository } from '../roles/repository';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { UserRepository } from '@modules/users/repository';
import { UserDetailsService } from './services/user-details.service';
import { FetchUserResponse, InvitedUserType, RoleUpdate, UserFilterOptions } from './types';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { ERROR_HANDLER, ERROR_HANDLER_TITLE } from '@modules/organizations/constants';
import { MODULE_INFO } from '@modules/app/constants/module-info';
import { MODULES } from '@modules/app/constants/modules';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { OrganizationRepository } from '@modules/organizations/repository';
import * as uuid from 'uuid';
import { LicenseOrganizationService } from '@modules/licensing/services/organization.service';
import { SessionUtilService } from '@modules/session/util.service';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';
import { IOrganizationUsersUtilService } from './interfaces/IUtilService';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class OrganizationUsersUtilService implements IOrganizationUsersUtilService {
  constructor(
    protected readonly rolesUtilService: RolesUtilService,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly groupPermissionsUtilService: GroupPermissionsUtilService,
    protected readonly instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly organizationUsersRepository: OrganizationUsersRepository,
    protected readonly configService: ConfigService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly rolesRepository: RolesRepository,
    protected readonly userRepository: UserRepository,
    protected readonly userDetailsService: UserDetailsService,
    protected readonly groupPermissionsRepository: GroupPermissionsRepository,
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly sessionUtilsService: SessionUtilService,
    protected readonly licenseOrganizationService: LicenseOrganizationService
  ) {}

  updateUserMetadata(manager: EntityManager, userId: string, organizationId: string, userMetadata: any) {
    if (userMetadata) {
      return this.userDetailsService.updateUserMetadata(manager, userId, organizationId, userMetadata);
    }
    return;
  }

  async updateUserDetails(userId: string, basicDetails: Partial<User>, manager?: EntityManager) {
    const { firstName, lastName } = basicDetails;
    const userUpdatableParams = {
      firstName,
      lastName,
    };
    await this.userRepository.updateOne(userId, userUpdatableParams, manager);
  }

  async handleGroupsAndRoleChanges(
    user: Partial<User>,
    organizationId: string,
    roleUpdateObj: RoleUpdate,
    manager: EntityManager
  ) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const { addGroups, role, adminId } = roleUpdateObj;
      // Step 1 - Remove all custom groups
      await this.groupPermissionsRepository.removeUserFromAllCustomGroupUser(user.id, organizationId, manager);

      // Step 2 - Change the role if required
      if (role) {
        const currentRole = await this.rolesRepository.getUserRole(user.id, organizationId, manager);
        await this.rolesUtilService.editDefaultGroupUserRole(
          organizationId,
          { newRole: role, userId: user.id, updatingUserId: adminId, currentRole: currentRole },
          manager
        );
      }

      // Step 3 - Attach the new groups
      try {
        const endUsers = await this.rolesRepository.getRoleUsersList(
          USER_ROLE.END_USER,
          organizationId,
          [user.id],
          manager
        );
        for (const addGroup of addGroups) {
          await this.groupPermissionsUtilService.addUsersToGroup(
            { allowRoleChange: false, userIds: [user.id], groupId: addGroup, endUsers },
            organizationId,
            manager
          );
        }
      } catch (error: unknown) {
        if (error instanceof ConflictException) {
          throw new BadRequestException({
            message: {
              error:
                'End-users can only be granted permission to view apps. Kindly change the user role or custom group to continue.',
              title: 'Conflicting permissions',
            },
          });
        } else {
          throw error;
        }
      }

      // Step 4 - License check
      await this.licenseUserService.validateUser(manager);
    }, manager);
  }

  async attachUserGroup(
    groups: string[],
    organizationId: string,
    userId: string,
    areGroupIds: boolean = false,
    manager?: EntityManager
  ): Promise<void> {
    if (!groups) return;
    await dbTransactionWrap(async (manager: EntityManager) => {
      if (!groups?.length) {
        return;
      }

      try {
        for (const addGroup of groups) {
          const groupQuery = areGroupIds
            ? { organizationId: organizationId, id: addGroup }
            : { organizationId: organizationId, name: addGroup };

          const orgGroupPermission = await this.groupPermissionsRepository.getGroup(groupQuery, manager);
          if (!orgGroupPermission) {
            throw new BadRequestException(`${addGroup} group does not exist for current organization`);
          }
          await this.groupPermissionsUtilService.addUsersToGroup(
            { allowRoleChange: false, userIds: [userId], groupId: orgGroupPermission.id },
            organizationId,
            manager
          );
        }
      } catch (error: unknown) {
        if (error instanceof ConflictException) {
          throw new BadRequestException({
            message: {
              error:
                'End-users can only be granted permission to view apps. Kindly change the user role or custom group to continue.',
              title: 'Conflicting permissions',
            },
          });
        } else {
          throw error;
        }
      }
    }, manager);
  }

  async updateUserStatus(userId: string, status: string, manager?: EntityManager) {
    await this.userRepository.updateOne(userId, { status }, manager);
  }

  async findInvitingUserByEmail(email: string, manager?: EntityManager): Promise<User> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(User, {
        where: { email },
        relations: {
          organization: true,
        },
      });
    }, manager);
  }

  async validateInvitingUser(email: string, organizationId: string, manager: EntityManager): Promise<User> {
    const user = await this.findInvitingUserByEmail(email, manager);
    if (user?.status === USER_STATUS.ARCHIVED) {
      throw new BadRequestException('User is archived in the instance. Contact super admin to activate them.');
    }
    if (user?.organizationUsers?.some((ou) => ou.organizationId === organizationId)) {
      throw new BadRequestException({
        message: {
          error: ERROR_HANDLER.DUPLICATE_EMAIL_PRESENT,
          title: ERROR_HANDLER_TITLE.DUPLICATE_EMAIL_PRESENT,
        },
      });
    }
    return user;
  }

  async createDefaultOrganization(manager: EntityManager) {
    const { name, slug } = generateNextNameAndSlug('My workspace');
    return await this.setupOrganizationsUtilService.create(name, slug, null, manager);
  }

  addUserAsAdmin(userId: string, organizationId: string, manager: EntityManager) {
    return this.rolesUtilService.addUserRole(organizationId, { role: USER_ROLE.ADMIN, userId }, manager);
  }

  async createOrUpdateUser(
    userParams: Partial<User>,
    existingUser: User,
    defaultOrganizationId: string,
    manager: EntityManager
  ): Promise<User> {
    if (existingUser) {
      return existingUser;
    }
    const { email, firstName, lastName, password, source, status, onboardingStatus } = userParams;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const userType = (await manager.count(User)) === 0 ? USER_TYPE.INSTANCE : USER_TYPE.WORKSPACE;

      return await this.userRepository.createOrUpdate(
        {
          email,
          firstName,
          lastName,
          password,
          onboardingStatus,
          source,
          status,
          userType,
          invitationToken: uuid.v4(),
          defaultOrganizationId: defaultOrganizationId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        manager
      );
    }, manager);
  }

  protected async mapOrganizationUserToResponse(
    orgUser: OrganizationUser,
    isBasicPlan: boolean
  ): Promise<FetchUserResponse> {
    const userDetails = orgUser.user.userDetails.find((ud) => ud.organizationId === orgUser.organizationId);
    const userMetadata = await this.sessionUtilsService.decryptUserMetadata(userDetails?.userMetadata);

    const role = orgUser.user.userPermissions.filter((group) => group.type === GROUP_PERMISSIONS_TYPE.DEFAULT);
    const groups = orgUser.user.userPermissions.filter((group) => group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP);
    return {
      email: orgUser.user.email,
      firstName: orgUser.user.firstName ?? '',
      lastName: orgUser.user.lastName ?? '',
      name: fullName(orgUser.user.firstName, orgUser.user.lastName),
      id: orgUser.id,
      userId: orgUser.user.id,
      role: orgUser.role,
      status: orgUser.status,
      avatarId: orgUser.user.avatarId,
      groups: groups.map((groupPermission) => ({ name: groupPermission.name, id: groupPermission.id })),
      roleGroup: role.map((groupPermission) => ({ name: groupPermission.name, id: groupPermission.id })),
      ...(orgUser.invitationToken ? { invitationToken: orgUser.invitationToken } : {}),
      ...(this.configService.get<string>('HIDE_ACCOUNT_SETUP_LINK') !== 'true' && orgUser.user.invitationToken
        ? { accountSetupToken: orgUser.user.invitationToken }
        : {}),
      userMetadata,
    };
  }

  async sendWelcomeEmail(
    user: User,
    organizationUser: OrganizationUser,
    organization: Organization,
    inviterName: string,
    isNewUser: boolean
  ): Promise<void> {
    if (isNewUser) {
      this.eventEmitter.emit('emailEvent', {
        type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
        payload: {
          to: user.email,
          name: user.firstName,
          invitationtoken: user.invitationToken,
          organizationInvitationToken: organizationUser.invitationToken,
          organizationId: organizationUser.organizationId,
          organizationName: organization.name,
          sender: inviterName,
        },
      });
    } else {
      this.eventEmitter.emit('emailEvent', {
        type: EMAIL_EVENTS.SEND_ORGANIZATION_USER_WELCOME_EMAIL,
        payload: {
          to: user.email,
          name: user.firstName,
          sender: inviterName,
          invitationtoken: organizationUser.invitationToken,
          organizationName: organization.name,
          organizationId: organizationUser.organizationId,
        },
      });
    }
  }

  async activateOrganization(organizationUser: OrganizationUser, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(OrganizationUser, organizationUser.id, {
        status: WORKSPACE_USER_STATUS.ACTIVE,
        invitationToken: null,
      });
    }, manager);
  }

  async personalWorkspaceCount(userId: string): Promise<number> {
    const personalWorkspacesCount = await this.personalWorkspaces(userId);
    return personalWorkspacesCount?.length;
  }

  async personalWorkspaces(userId: string): Promise<OrganizationUser[]> {
    const personalWorkspaces: Partial<OrganizationUser[]> = await this.organizationUsersRepository.find({
      select: ['organizationId', 'invitationToken'],
      where: { userId },
    });
    const personalWorkspaceArray: OrganizationUser[] = [];
    for (const workspace of personalWorkspaces) {
      const { organizationId } = workspace;
      const workspaceOwner = await this.organizationUsersRepository.find({
        where: { organizationId },
        order: { createdAt: 'ASC' },
        take: 1,
      });
      if (workspaceOwner[0]?.userId === userId) {
        /* First user of the workspace = created by the user */
        personalWorkspaceArray.push(workspace);
      }
    }

    return personalWorkspaceArray;
  }

  async getUser(token: string) {
    return await this.organizationUsersRepository.findOneOrFail({
      where: { invitationToken: token },
      relations: ['user'],
    });
  }

  prepareUserParams(inviteNewUserDto: InviteNewUserDto): Partial<User> {
    return {
      firstName: inviteNewUserDto.firstName,
      lastName: inviteNewUserDto.lastName,
      email: inviteNewUserDto.email,
      ...getUserStatusAndSource(lifecycleEvents.USER_INVITE),
    };
  }

  async checkPersonalWorkspaceAllowed(): Promise<boolean> {
    const isPersonalWorkspaceAllowedConfig = await this.instanceSettingsUtilService.getSettings(
      INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE
    );
    return isPersonalWorkspaceAllowedConfig === 'true';
  }

  async isAllWorkspacesArchivedBySuperAdmin(userId: string) {
    const archivedWorkspaceCount = await this.organizationUsersRepository.count({
      where: {
        userId,
        status: WORKSPACE_USER_STATUS.ARCHIVED,
      },
    });
    const allWorkspacesCount = await this.organizationUsersRepository.count({
      where: {
        userId,
      },
    });
    return allWorkspacesCount === archivedWorkspaceCount;
  }

  async fetchUsers(
    user: User,
    options: UserFilterOptions,
    page = 1
  ): Promise<{ organizationUsers: FetchUserResponse[]; total: number }> {
    const isBasicPlan = !(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.VALID));
    const pageSize = 10;

    const [organizationUsers, count] = await this.organizationUsersRepository.fetchUsersWithDetails(
      user.organizationId,
      options,
      page,
      pageSize
    );

    const result = await Promise.all(
      organizationUsers.map(async (orgUser) => this.mapOrganizationUserToResponse(orgUser, isBasicPlan))
    );

    return { organizationUsers: result, total: count };
  }

  async inviteUserswrapper(users, currentUser: User): Promise<void> {
    await dbTransactionWrap(async (manager) => {
      for (let i = 0; i < users.length; i++) {
        await this.inviteNewUser(currentUser, users[i], manager);
      }
    });
  }

  async inviteNewUser(
    currentUser: User,
    inviteNewUserDto: InviteNewUserDto,
    manager?: EntityManager
  ): Promise<OrganizationUser> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const userParams = this.prepareUserParams(inviteNewUserDto);
      const user = await this.validateInvitingUser(userParams.email, currentUser.organizationId, manager);

      if (user?.invitationToken) {
        await this.updateUserDetails(
          user.id,
          { firstName: userParams.firstName, lastName: userParams.lastName, source: userParams.source },
          manager
        );
      }
      const isPersonalWorkspaceAllowed = await this.checkPersonalWorkspaceAllowed();
      const defaultOrganization =
        !user && isPersonalWorkspaceAllowed ? await this.createDefaultOrganization(manager) : null;

      const updatedUser = await this.createOrUpdateUser(
        userParams,
        user,
        isPersonalWorkspaceAllowed ? defaultOrganization?.id : null,
        manager
      );

      if (defaultOrganization) {
        await this.addUserAsAdmin(updatedUser.id, defaultOrganization.id, manager);
        await this.organizationUsersRepository.createOne(updatedUser, defaultOrganization, true, manager);
      }

      if (inviteNewUserDto.userMetadata) {
        await this.updateUserMetadata(
          manager,
          updatedUser.id,
          currentUser.organizationId,
          inviteNewUserDto.userMetadata
        );
      }

      const currentOrganization = await this.organizationRepository.fetchOrganization(
        currentUser.organizationId,
        manager
      );

      const organizationUser = await this.organizationUsersRepository.createOne(
        updatedUser,
        currentOrganization,
        true,
        manager
      );

      /* Add role and groups to the user */
      if (inviteNewUserDto.role) {
        await this.rolesUtilService.addUserRole(
          currentOrganization.id,
          {
            role: inviteNewUserDto.role,
            userId: updatedUser.id,
          },
          manager
        );
      }

      await this.attachUserGroup(inviteNewUserDto.groups, currentOrganization.id, updatedUser.id, true, manager);

      await this.licenseUserService.validateUser(manager);
      await this.licenseOrganizationService.validateOrganization(manager);

      /* Send welcome email */
      const inviterName = fullName(currentUser.firstName, currentUser.lastName);
      await this.sendWelcomeEmail(
        updatedUser,
        organizationUser,
        currentOrganization,
        inviterName,
        !user || !!user.invitationToken
      );

      this.eventEmitter.emit(
        'auditLogEntry',
        {
          userId: currentUser.id,
          organizationId: currentOrganization.id,
          resourceId: currentOrganization.id,
          resourceName: updatedUser.email,
          resourceType: MODULES.USER,
          actionType: MODULE_INFO.USER_INVITE,
        },
        manager
      );

      return organizationUser;
    }, manager);
  }

  createGroupsList(groups: string) {
    return groups?.length ? groups.split('|') : [];
  }

  convertUserRolesCasing(role: string) {
    switch (role) {
      case 'End User':
        return USER_ROLE.END_USER;
      case 'Builder':
        return USER_ROLE.BUILDER;
      case 'Admin':
        return USER_ROLE.ADMIN;
      default:
        break;
    }
  }

  async throwErrorIfUserIsLastActiveAdmin(user: User, organizationId: string) {
    const result = await this.rolesRepository.getRoleUsersList(USER_ROLE.ADMIN, organizationId);
    const allActiveAdmins = result.filter((admin) => admin.organizationUsers[0].status === USER_STATUS.ACTIVE);
    const isActiveAdmin = allActiveAdmins.some((userItem) => userItem.id === user.id);
    if (isActiveAdmin && allActiveAdmins.length == 1) {
      throw new BadRequestException('Atleast one active admin is required');
    }
  }

  async findByWorkspaceInviteToken(invitationToken: string): Promise<InvitedUserType> {
    const organizationUser = await this.organizationUsersRepository.findByInvitationToken(invitationToken);

    if (organizationUser?.organization?.status === WORKSPACE_STATUS.ARCHIVE) {
      /* Invited workspace is archive */
      const errorResponse = {
        message: {
          error: 'The workspace is archived. Please contact the super admin to get access.',
          isWorkspaceArchived: true,
        },
      };
      throw new BadRequestException(errorResponse);
    }

    const user: InvitedUserType = organizationUser?.user;
    /* Invalid organization token */
    if (!user) {
      const errorResponse = {
        message: {
          error: 'Invalid invitation token. Please ensure that you have a valid invite url',
          isInvalidInvitationUrl: true,
        },
      };
      throw new BadRequestException(errorResponse);
    }
    user.invitedOrganizationId = organizationUser.organizationId;
    user.organizationStatus = organizationUser.status;
    user.organizationUserSource = organizationUser.source;
    return user;
  }
}
