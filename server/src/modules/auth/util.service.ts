import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { UserRepository } from '@modules/users/repository';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { RolesUtilService } from '@modules/roles/util.service';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { generateNextNameAndSlug } from 'src/helpers/utils.helper';
const uuid = require('uuid');
import { Organization } from '../../entities/organization.entity';
import { EntityManager } from 'typeorm';
import {
  getUserErrorMessages,
  getUserStatusAndSource,
  USER_STATUS,
  lifecycleEvents,
  WORKSPACE_USER_STATUS,
  WORKSPACE_USER_SOURCE,
} from '@modules/users/constants/lifecycle';
import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_USER_SETTINGS } from '../instance-settings/constants';
import { OrganizationUsersUtilService } from '../organization-users/util.service';
import { GROUP_PERMISSIONS_TYPE, USER_ROLE } from '@modules/group-permissions/constants';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { DeepPartial } from 'typeorm';
import { SSOType } from '../../entities/sso_config.entity';
import { LicenseTermsService } from '../licensing/interfaces/IService';
import { GroupPermissionsUtilService } from '../group-permissions/util.service';
import { App } from '../../entities/app.entity';
import { In } from 'typeorm';
import UserResponse from './oauth/models/user_response';
import { SSOConfigs } from '../../entities/sso_config.entity';
import { OnboardingUtilService } from '@modules/onboarding/util.service';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { OrganizationRepository } from '@modules/organizations/repository';
import { RolesRepository } from '@modules/roles/repository';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { ProfileUtilService } from '@modules/profile/util.service';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { SessionUtilService } from '@modules/session/util.service';
import { OnboardingStatus } from '@modules/onboarding/constants';
import { IAuthUtilService } from './interfaces/IUtilService';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';

@Injectable()
export class AuthUtilService implements IAuthUtilService {
  constructor(
    protected readonly userRepository: UserRepository,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly configService: ConfigService,
    protected licenseTermsService: LicenseTermsService,
    protected organizationUsersUtilService: OrganizationUsersUtilService,
    protected organizationUsersRepository: OrganizationUsersRepository,
    protected organizationRepository: OrganizationRepository,
    protected sessionUtilService: SessionUtilService,
    protected readonly roleUtilService: RolesUtilService,
    protected readonly groupPermissionsUtilService: GroupPermissionsUtilService,
    protected readonly onboardingUtilService: OnboardingUtilService,
    protected readonly instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly rolesRepository: RolesRepository,
    protected profileUtilService: ProfileUtilService,
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService
  ) {}

  async validateLoginUser(email: string, password: string, organizationId?: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email, organizationId, [
      WORKSPACE_USER_STATUS.ACTIVE,
      WORKSPACE_USER_STATUS.ARCHIVED,
    ]);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedException(getUserErrorMessages(user.status));
    }

    if (organizationId) {
      const organizationUser = user.organizationUsers.find(
        (organizationUser) => organizationUser.organizationId === organizationId
      );
      if (organizationUser && organizationUser.status === WORKSPACE_USER_STATUS.ARCHIVED) {
        throw new UnauthorizedException(
          'You have been archived from this workspace. Sign in to another workspace or contact admin to know more.'
        );
      }
    }

    const passwordRetryConfig = this.configService.get<string>('PASSWORD_RETRY_LIMIT');
    const passwordRetryAllowed = passwordRetryConfig ? parseInt(passwordRetryConfig) : 5;

    if (
      this.configService.get<string>('DISABLE_PASSWORD_RETRY_LIMIT') !== 'true' &&
      user.passwordRetryCount >= passwordRetryAllowed
    ) {
      throw new UnauthorizedException(
        'Maximum password retry limit reached, please reset your password using forgot password option'
      );
    }

    if (!(await bcrypt.compare(password, user.password))) {
      await this.userRepository.update(user.id, { passwordRetryCount: user.passwordRetryCount + 1 });
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async getSignupUserOnboardingDetails(user: User) {
    return {
      ...(await this.onboardingUtilService.getCommonOnboardingDetails(user)),
      userId: user.id,
      resumeOnboardingSession: ![OnboardingStatus.NOT_STARTED, OnboardingStatus.ONBOARDING_COMPLETED].includes(
        user.onboardingStatus as OnboardingStatus
      ),
    };
  }

  verifyToken(token: string) {
    try {
      const signedJwt = this.sessionUtilService.verifyToken(token);
      return signedJwt;
    } catch (err) {
      return null;
    }
  }

  async findOrCreateUser(
    { firstName, lastName, email, sso, groups: ssoGroups, profilePhoto }: any,
    organization: DeepPartial<Organization>,
    manager?: EntityManager
  ): Promise<User> {
    // User not exist in the workspace, creating
    let user: User;
    let defaultOrganization: Organization;
    user = await this.userRepository.findByEmail(email);

    const allowPersonalWorkspace =
      (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';

    const organizationUser: OrganizationUser = user?.organizationUsers?.find(
      (ou) => ou.organizationId === organization.id
    );

    if (organizationUser?.status === WORKSPACE_USER_STATUS.ARCHIVED) {
      throw new UnauthorizedException('User is archived in the workspace');
    }

    if (!user && allowPersonalWorkspace) {
      const { name, slug } = generateNextNameAndSlug('My workspace');
      defaultOrganization = await this.setupOrganizationsUtilService.create(name, slug, null, manager);
    }

    const { source, status } = getUserStatusAndSource(lifecycleEvents.USER_SSO_ACTIVATE, sso);
    /* Default password for sso-signed workspace user */

    const password = uuid.v4();
    user = await this.userRepository.createOrUpdate(
      {
        firstName,
        lastName,
        email,
        source: defaultOrganization?.id ? WORKSPACE_USER_SOURCE.SIGNUP : source,
        status: defaultOrganization?.id ? USER_STATUS.ACTIVE : status,
        password,
        role: defaultOrganization?.id ? USER_ROLE.ADMIN : USER_ROLE.END_USER,
        defaultOrganizationId: defaultOrganization?.id || organization.id,
      },
      manager
    );

    /* Create avatar if profilePhoto available */
    if (profilePhoto) {
      try {
        await this.profileUtilService.addAvatar(user.id, profilePhoto, `${email}.jpeg`);
      } catch (error) {
        /* Should not break the flow */
        console.log('Profile picture upload failed', error);
      }
    }

    // Setting up invited organization, organization user status should be invited if user status is invited
    await this.organizationUsersRepository.createOne(
      user,
      organization,
      !!user.invitationToken,
      manager,
      WORKSPACE_USER_SOURCE.SIGNUP
    );
    await this.organizationUsersUtilService.attachUserGroup(
      [USER_ROLE.END_USER],
      organization.id,
      user.id,
      false,
      manager
    );
    if (defaultOrganization?.id) {
      // Setting up default organization
      await this.organizationUsersRepository.createOne(
        user,
        defaultOrganization,
        false,
        manager,
        WORKSPACE_USER_SOURCE.SIGNUP,
        true
      );
      await this.organizationUsersUtilService.attachUserGroup(
        [USER_ROLE.ADMIN],
        defaultOrganization.id,
        user.id,
        false,
        manager
      );
    }
    return user;
  }

  async getSSOConfigs(ssoType: SSOType.GOOGLE | SSOType.GIT): Promise<Partial<SSOConfigs>> {
    switch (ssoType) {
      case SSOType.GOOGLE:
        return {
          enabled: !!this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
          configs: { clientId: this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID') },
        };
      case SSOType.GIT:
        return {
          enabled: !!this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
          configs: {
            clientId: this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
            clientSecret: this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_SECRET'),
            hostName: this.configService.get<string>('SSO_GIT_OAUTH2_HOST'),
          },
        };
      default:
        return;
    }
  }

  async getInstanceSSOConfigsOfType(ssoType: SSOType.GOOGLE | SSOType.GIT): Promise<DeepPartial<SSOConfigs>> {
    const instanceSettings = await this.instanceSettingsUtilService.getSettings([
      INSTANCE_SYSTEM_SETTINGS.ALLOWED_DOMAINS,
      INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP,
    ]);
    return {
      organization: {
        enableSignUp: instanceSettings?.ENABLE_SIGNUP === 'true',
        domain: instanceSettings?.ALLOWED_DOMAINS,
      },
      sso: ssoType,
      ...(await this.getSSOConfigs(ssoType)),
    };
  }

  syncUserAndGroups = async (
    userResponse: UserResponse,
    userId: string,
    organizationId: string,
    manager: EntityManager
  ) => {
    await dbTransactionWrap(async (manager) => {
      const { groups: ssoGroups, profilePhoto, email } = userResponse;
      const normalizedSsoGroups =
        ssoGroups?.map((group) => {
          switch (group.toLowerCase()) {
            case USER_ROLE.ADMIN:
            case USER_ROLE.BUILDER:
            case USER_ROLE.END_USER:
              return group.toLowerCase(); // Normalize these specific entries to lowercase
            default:
              return group;
          }
        }) || [];

      // groups contains all group details from idp
      const groups = normalizedSsoGroups
        ? await manager.find(GroupPermissions, {
            where: {
              name: In(normalizedSsoGroups),
              organizationId,
            },
          })
        : [];

      // Custom groups details
      const customGroups = groups.filter((group) => group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP);
      const groupsIds = customGroups?.map((group) => group.id) || [];

      // Determine the highest order role (admin > builder > end-user)
      let newRole: USER_ROLE = null;
      const rolePriority = {
        [USER_ROLE.ADMIN]: 1,
        [USER_ROLE.BUILDER]: 2,
        [USER_ROLE.END_USER]: 3,
      };

      const roleGroups = groups.filter((group) => {
        return [USER_ROLE.ADMIN, USER_ROLE.END_USER, USER_ROLE.BUILDER].includes(group.name as USER_ROLE);
      });

      // Role is assigned
      if (roleGroups.length > 0) {
        // If only one role -> consider it
        if (roleGroups.length === 1) {
          newRole = roleGroups[0]?.name as USER_ROLE;
        } else {
          // Find higher order role
          newRole = roleGroups.reduce((highestRole, currentGroup) => {
            const currentRole = currentGroup.name as USER_ROLE;
            return rolePriority[currentRole] < rolePriority[highestRole] ? currentRole : highestRole;
          }, USER_ROLE.END_USER); // Default to END_USER if no higher role is found

          // Check if any custom group is editable
          const isEditableGroup = await Promise.all(
            customGroups.map((group) => this.roleUtilService.isEditableGroup(group, manager))
          );
          const hasEditableGroup = isEditableGroup.some((isEditable) => isEditable);

          // If any custom group is editable, ensure the role is at least 'builder' -> Not considering role mapping
          if (hasEditableGroup && rolePriority[newRole] > rolePriority[USER_ROLE.BUILDER]) {
            newRole = USER_ROLE.BUILDER;
          }
        }
      } else {
        // No role specified -> finding role
        newRole = await this.findUserRoleFromGroups(customGroups, manager);
        if (newRole === USER_ROLE.END_USER) {
          // If new role is end user and but user is app owner, assign editor role
          const appCounts = await manager.count(App, {
            where: {
              userId: userId,
              organizationId: organizationId,
            },
          });
          if (appCounts > 0) {
            newRole = USER_ROLE.END_USER;
          }
        }
      }

      // Remove user from existing role
      await this.groupPermissionsUtilService.deleteFromAllCustomGroupUser(userId, organizationId);

      /* Sync LDAP / SAML / OIDC groups before signup to the workspace */
      const currentRoleObj = await this.rolesRepository.getUserRole(userId, organizationId, manager);

      const currentRole = currentRoleObj?.name as USER_ROLE;

      // IF current role is empty -> user not exist
      // IF new role not equals current one
      if (!currentRole || (newRole !== currentRole && groups.length > 0)) {
        await this.roleUtilService.editDefaultGroupUserRole(
          organizationId,
          { newRole, userId, currentRole: currentRoleObj },
          manager
        );
      }

      if (ssoGroups?.length) {
        await this.organizationUsersUtilService.attachUserGroup(groupsIds, organizationId, userId, true, manager);
        await this.licenseUserService.validateUser(manager);
      }

      /* Create avatar if profilePhoto available */
      if (profilePhoto) {
        try {
          await this.profileUtilService.addAvatar(userId, profilePhoto, `${email}.jpeg`);
        } catch (error) {
          /* Should not break the flow */
          console.log('Profile picture upload failed', error);
        }
      }
    }, manager);
  };

  protected async findUserRoleFromGroups(groups: GroupPermissions[], manager: EntityManager): Promise<USER_ROLE> {
    return await dbTransactionWrap(async (manager) => {
      let builderLevelRole = false;

      await Promise.all(
        groups.map(async (group) => {
          const isBuilderGroup = await this.roleUtilService.isEditableGroup(group, manager);
          builderLevelRole = builderLevelRole || isBuilderGroup;
        })
      );

      return builderLevelRole ? USER_ROLE.BUILDER : USER_ROLE.END_USER;
    }, manager);
  }
}
