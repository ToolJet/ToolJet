import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DeepPartial, EntityManager } from 'typeorm';
import { OnboardingStatus, User } from '../../entities/user.entity';
import { UsersService } from '../../services/users.service';
import { OrganizationUsersService } from '../../services/organization_users.service';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { generateNextNameAndSlug, isHttpsEnabled } from 'src/helpers/utils.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResourceTypes, ActionTypes } from 'src/entities/audit_log.entity';
import { CreateAiUserDto } from './dto/create-ai-user.dto';
import { SOURCE, USER_STATUS, WORKSPACE_USER_SOURCE, WORKSPACE_USER_STATUS } from '@helpers/user_lifecycle';
import { AuthService } from '@services/auth.service';
import { CookieOptions, Response } from 'express';
import { GoogleOAuthService } from '@ee/services/oauth/google_oauth.service';
import { GitOAuthService } from '@ee/services/oauth/git_oauth.service';
import { SessionService } from '@services/session.service';
import { Organization } from '@entities/organization.entity';
import { SSOConfigs, SSOType } from '@entities/sso_config.entity';
import { OauthService } from '@ee/services/oauth';
import { LibraryAppCreationService } from '@services/library_app_creation.service';
import { OrganizationLicenseService } from '@services/organization_license.service';
import { LicenseService } from '@ee/licensing/service';
import { IAiOnboardingService } from '../interfaces/IService';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';
import { UserRepository } from '@modules/users/repositories/repository';
import { USER_TYPE } from '@modules/users/constants/lifecycle';

const uuid = require('uuid');
const bcrypt = require('bcrypt');

@Injectable()
export class AiOnboardingService implements IAiOnboardingService {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService,
    private organizationsService: OrganizationsService,
    private organizationUsersService: OrganizationUsersService,
    private eventEmitter: EventEmitter2,
    private googleOAuthService: GoogleOAuthService,
    private gitOAuthService: GitOAuthService,
    private sessionService: SessionService,
    private setupOrganizationService: SetupOrganizationsUtilService,
    private oauthService: OauthService,
    private libraryAppCreationService: LibraryAppCreationService,
    private organizationLicenseService: OrganizationLicenseService,
    private licenseService: LicenseService
  ) {}

  private async setupWorkspaceAndUser(
    params: {
      email: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
      existingUser?: User;
      source?: string;
    },
    manager: EntityManager
  ) {
    const { email, name, firstName, lastName, password, existingUser, source } = params;

    const user: User = existingUser;
    if (!user) {
      user = await this.userRepository.createOrUpdate(
        {
          email,
          firstName,
          lastName,
          password,
          status: USER_STATUS.ACTIVE,
          autoActivated: true,
          onboardingStatus: OnboardingStatus.ONBOARDING_COMPLETED,
          source,
          userType: USER_TYPE.WORKSPACE,
          defaultOrganizationId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        manager
      );
    }

    // Create AI workspace
    const workspaceNameSource = name || firstName || email;
    const { name: workspaceName, slug: workspaceSlug } = generateNextNameAndSlug(workspaceNameSource);
    const aiWorkspace = await this.setupOrganizationService.create(
      { name: workspaceName, slug: workspaceSlug, ownerId: user.id },
      user,
      manager
    );

    await this.userRepository.createOrUpdate(
      {
        email: user.email,
        defaultOrganizationId: aiWorkspace.id,
      },
      manager
    );

    // TODO
    await this.organizationLicenseService.generateCloudTrialLicense(
      {
        email: user.email,
        customerId: user.id,
        organizationId: aiWorkspace.id,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: '',
      },
      manager
    );

    return { user, aiWorkspace };
  }

  async handleOnboarding(
    userParams: CreateAiUserDto,
    existingUser?: User,
    response?: Response,
    ssoType?: SSOType.GOOGLE | SSOType.GIT,
    manager?: EntityManager
  ) {
    // Throw error if user exists
    if (ssoType) {
      return this.handleSSOSignIn(userParams, ssoType, response);
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { email, name, password } = userParams;

      const { user, aiWorkspace } = await this.setupWorkspaceAndUser(
        { email, name, password, existingUser, source: SOURCE.SIGNUP },
        manager
      );

      /* Create CRM user */
      void this.licenseService.createCRMUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        /* We are auto-activating trial for the user */
        isCloudTrialOpted: true,
        isUserAutoActivated: true,
      });

      return this.authService.generateLoginResultPayload(
        response,
        user,
        aiWorkspace,
        false,
        true,
        null,
        manager,
        null,
        {
          tj_api_source: 'ai_onboarding',
        }
      );
    }, manager);
  }

  private async handleSSOSignIn(params: any, ssoType: SSOType.GOOGLE | SSOType.GIT, response: Response) {
    let ssoResponse;
    const source = SOURCE[ssoType.toUpperCase()];
    const ssoConfigs: DeepPartial<SSOConfigs> = await this.oauthService.getInstanceSSOConfigs(ssoType);

    if (!ssoConfigs) {
      throw new UnauthorizedException('SSO provider not supported');
    }
    const { configs } = ssoConfigs;
    const { token } = params;

    try {
      switch (source) {
        case SOURCE.GOOGLE:
          ssoResponse = await this.googleOAuthService.signIn(token, configs);
          break;
        case SOURCE.GIT:
          ssoResponse = await this.gitOAuthService.signIn(token, configs);
          break;
        default:
          throw new UnauthorizedException('SSO provider not supported');
      }

      if (!ssoResponse) {
        throw new UnauthorizedException('Invalid SSO credentials');
      }

      ssoResponse.email = ssoResponse.email.toLowerCase();
      if (!ssoResponse.firstName) {
        // If firstName not found
        ssoResponse.firstName = ssoResponse.email?.split('@')?.[0];
      }

      const { email, firstName, lastName } = ssoResponse;
      const user = await this.sessionService.findByEmail(email);
      if (user) {
        return await dbTransactionWrap(async (manager: EntityManager) => {
          // User exists, return login payload
          const organizationList: Organization[] = await this.organizationService.findOrganizationWithLoginSupport(
            user,
            'sso',
            user.invitationToken
              ? [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED]
              : WORKSPACE_USER_STATUS.ACTIVE
          );

          const defaultOrgDetails: Organization = organizationList?.find((og) => og.id === user.defaultOrganizationId);
          let organizationDetails: Organization;

          if (defaultOrgDetails) {
            // default organization SSO login enabled
            organizationDetails = defaultOrgDetails;
          } else if (organizationList?.length) {
            // default organization SSO login not enabled, picking first one from SSO enabled list
            organizationDetails = organizationList[0];
          } else {
            // no SSO login enabled organization available for user - creating new one
            const { name, slug } = generateNextNameAndSlug('My workspace');
            organizationDetails = await this.organizationService.create(name, slug, user, manager);
            await this.usersService.updateUser(user.id, { defaultOrganizationId: organizationDetails.id }, manager);
          }

          /* Clear forgot password token */
          if (user.forgotPasswordToken) {
            await this.usersService.updateUser(user.id, { forgotPasswordToken: null }, manager);
          }

          return this.authService.generateLoginResultPayload(
            response,
            user,
            organizationDetails,
            true,
            false,
            null,
            manager
          );
        });
      }

      // Create new user with SSO
      return await dbTransactionWrap(async (manager: EntityManager) => {
        const password = bcrypt.hashSync(uuid.v4(), 10);
        const { user, aiWorkspace } = await this.setupWorkspaceAndUser(
          { email, firstName, lastName, password, source },
          manager
        );

        /* Create CRM user */
        void this.licenseService.createCRMUser({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isUserAutoActivated: true,
          isCloudTrialOpted: true,
        });

        return this.authService.generateLoginResultPayload(
          response,
          user,
          aiWorkspace,
          true,
          false,
          null,
          manager,
          null,
          {
            tj_api_source: 'ai_onboarding',
          }
        );
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid SSO credentials');
    }
  }

  async setAiCookies(response: Response, keyValues: Record<string, any>) {
    const cookieOptions: CookieOptions = {
      httpOnly: false,
      secure: isHttpsEnabled(),
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1-day expiration
    };

    const DEFAULT_COOKIE_KEYS = ['tj_ai_prompt', 'tj_template_id'];
    if (!Object.keys(keyValues).every((key) => DEFAULT_COOKIE_KEYS.includes(key))) {
      throw new UnauthorizedException('Invalid cookie key provided');
    }

    /* Iterate through the values and set cookies */
    for (const [key, value] of Object.entries(keyValues)) {
      response.cookie(key, value, cookieOptions);
    }

    return { message: 'AI Cookies set successfully' };
  }

  async setSessionAICookies(response: Response, keyValues: Record<string, any>) {
    const cookieOptions: CookieOptions = {
      secure: isHttpsEnabled(),
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 2 * 365 * 24 * 60 * 60 * 1000, // maximum expiry 2 years
    };

    const DEFAULT_COOKIE_KEYS = ['tj_ai_prompt', 'tj_template_id'];
    if (!Object.keys(keyValues).every((key) => DEFAULT_COOKIE_KEYS.includes(key))) {
      throw new UnauthorizedException('Invalid cookie key provided');
    }

    /* Iterate through the values and set cookies */
    for (const [key, value] of Object.entries(keyValues)) {
      response.cookie(key, value, cookieOptions);
    }

    return { message: 'AI Cookies set successfully' };
  }

  async clearSessionAICookies(response: Response, cookies: Record<string, any>) {
    if (cookies.tj_ai_prompt) {
      response.clearCookie('tj_ai_prompt', {
        secure: isHttpsEnabled(),
        httpOnly: true,
        sameSite: 'lax',
      });
    }
    if (cookies.tj_template_id) {
      response.clearCookie('tj_template_id', {
        secure: isHttpsEnabled(),
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    return { message: 'AI Cookies cleared successfully' };
  }
}
