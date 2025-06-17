import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DeepPartial, EntityManager, MoreThanOrEqual, Not } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { UserSessions } from '@entities/user_sessions.entity';
import { ConfigService } from '@nestjs/config';
import * as requestIp from 'request-ip';
import { User } from '@entities/user.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { Organization } from '@entities/organization.entity';
import { WORKSPACE_STATUS, USER_STATUS, WORKSPACE_USER_STATUS, USER_TYPE } from '@modules/users/constants/lifecycle';
import { isHttpsEnabled, isSuperAdmin } from '@helpers/utils.helper';
import { CookieOptions } from 'express';
import { decamelizeKeys } from 'humps';
import { JWTPayload } from '@modules/session/interfaces/IService';
import { Response } from 'express';
import { UserRepository } from '@modules/users/repository';
import * as _ from 'lodash';
import { OrganizationRepository } from '@modules/organizations/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { SSOConfigs } from '@entities/sso_config.entity';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';
import { MetadataUtilService } from '@modules/meta/util.service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { MODULES } from '@modules/app/constants/modules';
import { UserAppsPermissions, UserDataSourcePermissions, UserPermissions } from '@modules/ability/types';
import { JwtService } from '@nestjs/jwt';
import { RolesRepository } from '@modules/roles/repository';
import { EncryptionService } from '@modules/encryption/service';
import { OnboardingStatus } from '@modules/onboarding/constants';
import { RequestContext } from '@modules/request-context/service';

@Injectable()
export class SessionUtilService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly userRepository: UserRepository,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly groupPermissionsRepository: GroupPermissionsRepository,
    protected readonly organizationUsersRepository: OrganizationUsersRepository,
    protected readonly abilityService: AbilityService,
    protected readonly metadataUtilService: MetadataUtilService,
    protected readonly rolesRepository: RolesRepository,
    protected readonly encryptionService: EncryptionService,
    protected readonly jwtService: JwtService
  ) {}

  async terminateAllSessions(userId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserSessions, { userId });
    });
  }

  sign(JWTPayload: any): string {
    return this.jwtService.sign(JWTPayload);
  }

  async generateLoginResultPayload(
    response: Response,
    user: User,
    organization: DeepPartial<Organization>,
    isInstanceSSO: boolean,
    isPasswordLogin: boolean,
    loggedInUser?: User,
    manager?: EntityManager,
    invitedOrganizationId?: string,
    extraData?: any
  ): Promise<any> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const request = RequestContext?.currentContext?.req;
      const organizationIds = new Set([
        ...(loggedInUser?.id === user.id ? loggedInUser?.organizationIds || [] : []),
        ...(organization ? [organization.id] : []),
      ]);
      let sessionId = loggedInUser?.sessionId; // logged in user and new user are different -> creating session
      if (loggedInUser?.id !== user.id) {
        const clientIp = (request as any)?.clientIp;
        const session: UserSessions = await this.createSession(
          user.id,
          `IP: ${clientIp || (request && requestIp.getClientIp(request)) || 'unknown'} UA: ${
            request?.headers['user-agent'] || 'unknown'
          }`,
          manager
        );
        sessionId = session.id;
      }

      const JWTPayload: JWTPayload = {
        sessionId: sessionId,
        username: user.id,
        sub: user.email,
        organizationIds: [...organizationIds],
        isSSOLogin: loggedInUser?.isSSOLogin || isInstanceSSO,
        isPasswordLogin: loggedInUser?.isPasswordLogin || isPasswordLogin,
        ...(invitedOrganizationId ? { invitedOrganizationId } : {}),
      };

      if (organization) user.organizationId = organization.id;

      const cookieOptions: CookieOptions = {
        secure: isHttpsEnabled(),
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 2 * 365 * 24 * 60 * 60 * 1000, // maximum expiry 2 years
      };

      if (this.configService.get<string>('ENABLE_PRIVATE_APP_EMBED') === 'true') {
        // disable cookie security
        cookieOptions.sameSite = 'none';
        cookieOptions.secure = true;
      }
      response.cookie('tj_auth_token', this.sign(JWTPayload), cookieOptions);

      const isCurrentOrganizationArchived = organization?.status === WORKSPACE_STATUS.ARCHIVE;

      const permissionData = await this.getPermissionDataToAuthorize(user, manager);
      const noActiveWorkspaces = await this.checkUserWorkspaceStatus(user.id);

      const responsePayload = {
        organizationId: organization?.id,
        organization: organization?.name,
        isCurrentOrganizationArchived,
        ...(organization
          ? { currentOrganizationId: organization.id, currentOrganizationSlug: organization.slug }
          : { noWorkspaceAttachedInTheSession: true }),
        ...permissionData,
        noActiveWorkspaces,
        ...(extraData ? extraData : {}),
      };

      return decamelizeKeys(responsePayload);
    }, manager);
  }

  async getPermissionDataToAuthorize(
    user: User,
    manager: EntityManager
  ): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar_id: string;
    admin: boolean;
    superAdmin: boolean;
    metadata: any;
    ssoUserInfo: any;
    appGroupPermissions: UserAppsPermissions;
    dataSourceGroupPermissions: UserDataSourcePermissions;
    role: GroupPermissions;
    groupPermissions: GroupPermissions[];
    userPermissions: UserPermissions;
  }> {
    const groupPermissions = await this.getAllGroupsOfUser(user, manager);
    const userPermissions = await this.abilityService.resourceActionsPermission(
      user,
      {
        organizationId: user.organizationId,
        resources: [{ resource: MODULES.APP }, { resource: MODULES.GLOBAL_DATA_SOURCE }],
      },
      manager
    );

    const role = await this.rolesRepository.getUserRole(user.id, user.organizationId, manager);
    const isAdmin = userPermissions.isAdmin;
    const superAdmin = userPermissions.isSuperAdmin;
    const appGroupPermissions = userPermissions?.[MODULES.APP];
    const dataSourceGroupPermissions = userPermissions?.[MODULES.GLOBAL_DATA_SOURCE];
    const userDetails = await this.userRepository.getUserDetails(user.id, user.organizationId, manager);

    const metadata = userDetails?.userMetadata || '';
    const ssoUserInfo = userDetails?.ssoUserInfo || {};
    // Decrypt metadata values
    const decryptedMetadata = await this.decryptUserMetadata(metadata);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar_id: user.avatarId,
      admin: isAdmin,
      superAdmin,
      appGroupPermissions,
      dataSourceGroupPermissions,
      ssoUserInfo,
      metadata: decryptedMetadata,
      role,
      groupPermissions,
      userPermissions,
    };
  }

  async decryptUserMetadata(metadata: string) {
    try {
      if (!metadata || metadata === '') {
        return {};
      }

      const decryptedMetadata = await this.encryptionService.decryptColumnValue(
        'user_details',
        'userMetadata',
        metadata
      );

      return JSON.parse(decryptedMetadata);
    } catch (error) {
      return {};
    }
  }

  async getAllGroupsOfUser(user: User, manager: EntityManager) {
    const allGroups = await this.groupPermissionsRepository.getAllUserGroups(user.id, user.organizationId, manager);

    if (isSuperAdmin(user)) {
      const adminRole = await this.rolesRepository.getAdminRoleOfOrganization(user.organizationId, manager);
      if (allGroups && allGroups.length) {
        return [...allGroups.filter((group) => group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP), adminRole];
      }
      return [adminRole];
    }
    return allGroups;
  }

  async checkUserWorkspaceStatus(userId: string): Promise<boolean> {
    // Return true if user has no active workspaces
    return _.isEmpty(
      await this.userRepository.getUser(
        {
          id: userId,
          organizationUsers: {
            status: WORKSPACE_USER_STATUS.ACTIVE,
            organization: {
              status: WORKSPACE_STATUS.ACTIVE,
            },
          },
        },
        null,
        ['organizationUsers', 'organizationUsers.organization'],
        { id: true }
      )
    );
  }

  async createSession(userId: string, device: string, manager?: EntityManager): Promise<UserSessions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        manager.create(UserSessions, {
          userId,
          device,
          createdAt: new Date(),
          expiry: this.getSessionExpiry(),
          lastLoggedIn: new Date(),
        })
      );
    }, manager);
  }

  getSessionExpiry(): Date {
    // default expiry 10 days (14400 minutes)
    const now = new Date();
    return new Date(
      now.getTime() +
        (this.configService.get<string>('USER_SESSION_EXPIRY')
          ? this.configService.get<number>('USER_SESSION_EXPIRY')
          : 14400) *
          60000
    );
  }

  async generateInviteSignupPayload(
    response: Response,
    user: User,
    source: string,
    manager?: EntityManager
  ): Promise<any> {
    const request = RequestContext?.currentContext?.req;
    const clientIp = (request as any)?.clientIp;
    const { id, email, firstName, lastName } = user;

    const session: UserSessions = await this.createSession(
      user.id,
      `IP: ${clientIp || requestIp.getClientIp(request) || 'unknown'} UA: ${
        request?.headers['user-agent'] || 'unknown'
      }`,
      manager
    );
    const sessionId = session.id;

    const JWTPayload: JWTPayload = {
      sessionId,
      username: id,
      sub: email,
      organizationIds: [],
      isSSOLogin: source === 'sso',
      isPasswordLogin: source === 'signup',
    };

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isHttpsEnabled(),
      sameSite: 'strict',
      maxAge: 2 * 365 * 24 * 60 * 60 * 1000, // maximum expiry 2 years
    };

    if (this.configService.get<string>('ENABLE_PRIVATE_APP_EMBED') === 'true') {
      // disable cookie security
      cookieOptions.sameSite = 'none';
      cookieOptions.secure = true;
    }
    response.cookie('tj_auth_token', this.sign(JWTPayload), cookieOptions);

    return decamelizeKeys({
      id,
      email,
      firstName,
      lastName,
    });
  }

  async generateSessionPayload(user: User, currentOrganization: Organization, appData?: any) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const currentOrganizationId = currentOrganization?.id
        ? currentOrganization?.id
        : user?.organizationIds?.includes(user?.defaultOrganizationId)
        ? user.defaultOrganizationId
        : user?.organizationIds?.[0];
      const organizationDetails = currentOrganizationId
        ? currentOrganization
          ? currentOrganization
          : await manager.findOneOrFail(Organization, {
              where: { id: currentOrganizationId },
              select: ['slug', 'name', 'id'],
            })
        : null;

      const noWorkspaceAttachedInTheSession = (await this.checkUserWorkspaceStatus(user.id)) && !isSuperAdmin(user);
      const isAllWorkspacesArchived = await this.#isAllWorkspacesArchivedBySuperAdmin(user.id);
      const onboardingFlags = await this.#onboardingFlags(user);
      const metadata = await this.metadataUtilService.fetchMetadata();
      return decamelizeKeys({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        noWorkspaceAttachedInTheSession,
        isAllWorkspacesArchived,
        currentOrganizationId,
        currentOrganizationSlug: organizationDetails?.slug,
        currentOrganizationName: organizationDetails?.name,
        consulationBannerDate: metadata?.createdAt,
        ...onboardingFlags,
        ...(appData && { appData }),
      });
    });
  }

  async #isAllWorkspacesArchivedBySuperAdmin(userId: string) {
    // return true if all users workspaces are archived
    const activeWorkspaces = await this.organizationUsersRepository.count({
      where: {
        userId,
        status: Not(WORKSPACE_USER_STATUS.ARCHIVED),
      },
    });
    return activeWorkspaces === 0;
  }

  async #onboardingFlags(user: User) {
    let isFirstUserOnboardingCompleted = true;
    const isOnboardingCompleted = true;
    // const isOnboardingQuestionsEnabled =
    //   this.configService.get<string>('ENABLE_ONBOARDING_QUESTIONS_FOR_ALL_SIGN_UPS') === 'true';

    const instanceUsersCount = await this.userRepository.count({
      where: { status: USER_STATUS.ACTIVE },
    });

    /* Superadmin / First user check */
    const metadata = await this.metadataUtilService.fetchMetadata();
    if (instanceUsersCount === 1 && user.userType === USER_TYPE.INSTANCE && !metadata?.onboarded) {
      /* User is only one super admin in the instance & first user */
      isFirstUserOnboardingCompleted = user.onboardingStatus === OnboardingStatus.ONBOARDING_COMPLETED;
    }

    /* Signed up user check */
    // if (
    //   instanceUsersCount > 1 &&
    //   isOnboardingQuestionsEnabled &&
    //   user.onboardingStatus !== OnboardingStatus.ONBOARDING_COMPLETED
    // ) {
    //   /* Signed up user went through onboarding flow, didn't complete */
    //   isOnboardingCompleted = false;
    // }

    return { isFirstUserOnboardingCompleted, isOnboardingCompleted };
  }

  async switchOrganization(response: Response, newOrganizationId: string, user: User, isNewOrganization?: boolean) {
    if (!(isNewOrganization || user.isPasswordLogin || user.isSSOLogin)) {
      throw new UnauthorizedException();
    }
    const newUser = await this.userRepository.findByEmail(user.email, newOrganizationId, WORKSPACE_USER_STATUS.ACTIVE);

    /* User doesn't have access to this workspace */
    if (!newUser && !isSuperAdmin(newUser)) {
      throw new UnauthorizedException("User doesn't have access to this workspace");
    }
    newUser.organizationId = newOrganizationId;

    const organization: Organization = await this.organizationRepository.get(newUser.organizationId);

    const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

    if (
      !isSuperAdmin(newUser) && // bypassing login mode checks for super admin
      ((user.isPasswordLogin && !formConfigs?.enabled) || (user.isSSOLogin && !organization.inheritSSO))
    ) {
      // no configurations in organization side or Form login disabled for the organization
      throw new UnauthorizedException('Please log in to continue');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Updating default organization Id
      await this.userRepository.updateOne(newUser.id, { defaultOrganizationId: newUser.organizationId }, manager);

      return await this.generateLoginResultPayload(
        response,
        user,
        organization,
        user.isSSOLogin,
        user.isPasswordLogin,
        user
      );
    });
  }

  verifyToken(payload: string): any {
    return this.jwtService.verify(payload);
  }

  findActiveUser(email: string): Promise<User> {
    return this.userRepository.getUser({ email, status: USER_STATUS.ACTIVE });
  }

  async validateUserSession(userId: string, sessionId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const session: UserSessions = await manager.findOne(UserSessions, {
        where: {
          id: sessionId,
          expiry: MoreThanOrEqual(new Date()),
          user: {
            id: userId,
            status: USER_STATUS.ACTIVE,
          },
        },
        relations: ['user'],
      });

      if (!session) {
        throw new UnauthorizedException();
      }

      // extending expiry asynchronously
      session.expiry = this.getSessionExpiry();
      //Updating last_logged_in
      session.lastLoggedIn = new Date();
      manager.save(session).catch((err) => console.error('error while extending user session expiry', err));
    });
  }

  findOrganization(slug: string, manager?: EntityManager): Promise<Organization> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await manager.findOneOrFail(Organization, {
        where: { id: slug },
        select: ['id', 'slug', 'name', 'status'],
      });
      if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
        throw new BadRequestException('Organization is Archived');
      return organization;
    }, manager);
  }

  protected fetchJWTErrorType(options: { userStatusInOrganization: string }): string {
    switch (true) {
      case options.userStatusInOrganization === 'NOT_EXISTED':
        return 'USER_NOT_EXISTED';
      case options.userStatusInOrganization === WORKSPACE_USER_STATUS.ARCHIVED:
        return 'USER_ARCHIVED_IN_ORGANIZATION';
      case options.userStatusInOrganization === WORKSPACE_USER_STATUS.INVITED:
        return 'USER_INVITED_IN_ORGANIZATION';
      default:
        return 'SOMETHING_WENT_WRONG';
    }
  }

  async handleUnauthorizedUser(payload: any, organizationId: string): Promise<any> {
    /* Can create a seperate repository function later */
    const archivedUser = await this.userRepository.findByEmail(payload.sub, organizationId, [
      WORKSPACE_USER_STATUS.ARCHIVED,
      WORKSPACE_USER_STATUS.INVITED,
    ]);
    const status = archivedUser?.organizationUsers?.[0]?.status;
    throw new UnauthorizedException(
      JSON.stringify({
        organizationId,
        errorType: this.fetchJWTErrorType({
          userStatusInOrganization: status,
        }),
      })
    );
  }
}
