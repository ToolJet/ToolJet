import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@services/auth.service';
import { OrganizationsService } from '@services/organizations.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { DeepPartial, EntityManager } from 'typeorm';
import { GitOAuthService } from './git_oauth.service';
import { GoogleOAuthService } from './google_oauth.service';
import UserResponse from './models/user_response';

@Injectable()
export class OauthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationsService,
    private readonly organizationUsersService: OrganizationUsersService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly gitOAuthService: GitOAuthService,
    private configService: ConfigService
  ) {}

  #isValidDomain(email: string, restrictedDomain: string): boolean {
    if (!email) {
      return false;
    }
    const domain = email.substring(email.lastIndexOf('@') + 1);

    if (!restrictedDomain) {
      return true;
    }
    if (!domain) {
      return false;
    }
    if (
      !restrictedDomain
        .split(',')
        .map((e) => e && e.trim())
        .filter((e) => !!e)
        .includes(domain)
    ) {
      return false;
    }
    return true;
  }

  async #findOrCreateUser(
    { firstName, lastName, email }: UserResponse,
    organization: DeepPartial<Organization>,
    manager?: EntityManager
  ): Promise<User> {
    const existingUser = await this.usersService.findByEmail(email, organization.id, ['active', 'invited']);
    const organizationUser = existingUser?.organizationUsers?.[0];

    if (!organizationUser) {
      // User not exist in the workspace
      const { user, newUserCreated } = await this.usersService.findOrCreateByEmail(
        { firstName, lastName, email },
        organization.id,
        manager
      );

      if (newUserCreated) {
        await this.organizationUsersService.create(user, organization, false, manager);
      }
      return user;
    } else {
      if (organizationUser.status !== 'active') {
        await this.organizationUsersService.activate(organizationUser, manager);
      }
      return existingUser;
    }
  }

  async #findAndActivateUser(email: string, organizationId: string, manager?: EntityManager): Promise<User> {
    const user = await this.usersService.findByEmail(email, organizationId, ['active', 'invited']);
    if (!user) {
      throw new UnauthorizedException('User does not exist in the workspace');
    }
    const organizationUser: OrganizationUser = user.organizationUsers?.[0];

    if (!organizationUser) {
      throw new UnauthorizedException('User does not exist in the workspace');
    }
    if (organizationUser.status !== 'active') {
      await this.organizationUsersService.activate(organizationUser, manager);
    }
    return user;
  }

  #getSSOConfigs(ssoType: 'google' | 'git'): Partial<SSOConfigs> {
    switch (ssoType) {
      case 'google':
        return {
          enabled: !!this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
          configs: { clientId: this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID') },
        };
      case 'git':
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

  #getInstanceSSOConfigs(ssoType: 'google' | 'git'): DeepPartial<SSOConfigs> {
    return {
      organization: {
        enableSignUp: this.configService.get<string>('SSO_DISABLE_SIGNUPS') !== 'true',
        domain: this.configService.get<string>('SSO_ACCEPTED_DOMAINS'),
      },
      sso: ssoType,
      ...this.#getSSOConfigs(ssoType),
    };
  }

  async signIn(ssoResponse: SSOResponse, configId?: string, ssoType?: 'google' | 'git'): Promise<any> {
    const { organizationId } = ssoResponse;
    let ssoConfigs: DeepPartial<SSOConfigs>;
    let organization: DeepPartial<Organization>;
    const isSingleOrganization = this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true';

    if (configId) {
      // SSO under an organization
      ssoConfigs = await this.organizationService.getConfigs(configId);
      organization = ssoConfigs?.organization;
    } else if (!isSingleOrganization && ssoType && organizationId) {
      // Instance SSO login from organization login page
      organization = await this.organizationService.fetchOrganizationDetails(organizationId, [true], false, true);
      ssoConfigs = organization?.ssoConfigs?.find((conf) => conf.sso === ssoType);
    } else if (!isSingleOrganization && ssoType) {
      // Instance SSO login from common login page
      ssoConfigs = this.#getInstanceSSOConfigs(ssoType);
      organization = ssoConfigs?.organization;
    } else {
      throw new UnauthorizedException();
    }

    if (!organization || !ssoConfigs) {
      // Should obtain organization configs
      throw new UnauthorizedException();
    }
    const { enableSignUp, domain } = organization;
    const { sso, configs } = ssoConfigs;
    const { token } = ssoResponse;

    let userResponse: UserResponse;
    switch (sso) {
      case 'google':
        userResponse = await this.googleOAuthService.signIn(token, configs);
        break;

      case 'git':
        userResponse = await this.gitOAuthService.signIn(token, configs);
        break;

      default:
        break;
    }

    if (!(userResponse.userSSOId && userResponse.email)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!this.#isValidDomain(userResponse.email, domain)) {
      throw new UnauthorizedException(`You cannot sign in using the mail id - Domain verification failed`);
    }

    if (!userResponse.firstName) {
      // If firstName not found
      userResponse.firstName = userResponse.email?.split('@')?.[0];
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      let userDetails: User;
      let organizationDetails: DeepPartial<Organization>;
      const isInstanceSSOLogin = !!(!configId && ssoType);

      if (!isSingleOrganization && isInstanceSSOLogin && !organizationId) {
        // Login from main login page - Multi-Workspace enabled
        userDetails = await this.usersService.findByEmail(userResponse.email);

        if (!userDetails && enableSignUp) {
          // Create new user
          let defaultOrganization: DeepPartial<Organization> = organization;

          // Not logging in to specific organization, creating new
          defaultOrganization = await this.organizationService.create('Untitled workspace', null, manager);

          const groups = ['all_users', 'admin'];
          userDetails = await this.usersService.create(
            {
              firstName: userResponse.firstName,
              lastName: userResponse.lastName,
              email: userResponse.email,
            },
            defaultOrganization.id,
            groups,
            null,
            null,
            null,
            manager
          );

          await this.organizationUsersService.create(userDetails, defaultOrganization, false, manager);
          organizationDetails = defaultOrganization;
        } else if (!userDetails) {
          throw new UnauthorizedException('User does not exist in the workspace');
        } else if (userDetails.invitationToken) {
          // User account setup not done, activating default organization ONLY IF PERSONAL WORKSPACE IS ALLOWED

          const defaultOrganizationUser = userDetails?.organizationUsers?.find(
            (ou) => ou.organizationId === userDetails.defaultOrganizationId
          );
          if (!defaultOrganizationUser) {
            throw new UnauthorizedException('User does not exist in the workspace');
          }
          await this.organizationUsersService.activate(defaultOrganizationUser, manager);
        }

        if (!organizationDetails) {
          // Finding organization to be loaded
          const organizationList: Organization[] = await this.organizationService.findOrganizationWithLoginSupport(
            userDetails,
            'sso'
          );

          const defaultOrgDetails: Organization = organizationList?.find(
            (og) => og.id === userDetails.defaultOrganizationId
          );
          if (defaultOrgDetails) {
            // default organization SSO login enabled
            organizationDetails = defaultOrgDetails;
          } else if (organizationList?.length > 0) {
            // default organization SSO login not enabled, picking first one from SSO enabled list
            organizationDetails = organizationList[0];
          } else {
            // no SSO login enabled organization available for user - creating new one
            organizationDetails = await this.organizationService.create('Untitled workspace', userDetails, manager);
          }
        }
      } else {
        userDetails = await (!enableSignUp
          ? this.#findAndActivateUser(userResponse.email, organization.id, manager)
          : this.#findOrCreateUser(userResponse, organization, manager));

        if (!userDetails) {
          throw new UnauthorizedException(`Email id ${userResponse.email} is not registered`);
        }

        organizationDetails = organization;
      }
      return await this.authService.generateLoginResultPayload(
        userDetails,
        organizationDetails,
        isInstanceSSOLogin,
        false,
        manager
      );
    });
  }
}

interface SSOResponse {
  token: string;
  state?: string;
  organizationId?: string;
}
