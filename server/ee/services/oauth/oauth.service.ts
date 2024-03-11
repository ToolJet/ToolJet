import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@services/auth.service';
import { OrganizationsService } from '@services/organizations.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { decamelizeKeys } from 'humps';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import {
  getUserErrorMessages,
  getUserStatusAndSource,
  USER_STATUS,
  lifecycleEvents,
  URL_SSO_SOURCE,
  WORKSPACE_USER_STATUS,
} from 'src/helpers/user_lifecycle';
import { dbTransactionWrap, generateInviteURL, generateNextNameAndSlug, isValidDomain } from 'src/helpers/utils.helper';
import { DeepPartial, EntityManager } from 'typeorm';
import { GitOAuthService } from './git_oauth.service';
import { GoogleOAuthService } from './google_oauth.service';
import UserResponse from './models/user_response';
import { Response } from 'express';
import { SIGNUP_ERRORS } from 'src/helpers/errors.constants';
const uuid = require('uuid');

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

  async #findOrCreateUser(
    { firstName, lastName, email, sso }: UserResponse,
    organization: DeepPartial<Organization>,
    manager?: EntityManager
  ): Promise<User> {
    // User not exist in the workspace, creating
    let user: User;
    let defaultOrganization: Organization;
    user = await this.usersService.findByEmail(email);

    const organizationUser: OrganizationUser = user?.organizationUsers?.find(
      (ou) => ou.organizationId === organization.id
    );

    if (organizationUser?.status === WORKSPACE_USER_STATUS.ARCHIVED) {
      throw new UnauthorizedException('User does not exist in the workspace');
    }

    if (!user) {
      const { name, slug } = generateNextNameAndSlug('My workspace');
      defaultOrganization = await this.organizationService.create(name, slug, null, manager);
    }

    const groups = ['all_users'];
    /* Default password for sso-signed workspace user */
    const password = uuid.v4();
    user = await this.usersService.create(
      { firstName, lastName, email, ...getUserStatusAndSource(lifecycleEvents.USER_SSO_VERIFY, sso), password },
      organization.id,
      groups,
      user,
      true,
      defaultOrganization?.id,
      manager
    );
    // Setting up invited organization, organization user status should be invited if user status is invited
    await this.organizationUsersService.create(user, organization, !!user.invitationToken, manager);

    if (defaultOrganization) {
      // Setting up default organization
      await this.organizationUsersService.create(user, defaultOrganization, true, manager);
      await this.usersService.attachUserGroup(['all_users', 'admin'], defaultOrganization.id, user.id, manager);
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

  async signIn(
    response: Response,
    ssoResponse: SSOResponse,
    configId?: string,
    ssoType?: 'google' | 'git',
    user?: User
  ): Promise<any> {
    const {
      organizationId: loginOrganiaztionId,
      signupOrganizationId,
      invitationToken: signUpInvitationToken,
      redirectTo,
    } = ssoResponse;
    let ssoConfigs: DeepPartial<SSOConfigs>;
    let organization: DeepPartial<Organization>;
    const organizationId = loginOrganiaztionId || signupOrganizationId;
    const isInstanceSSOLogin = !!(!configId && ssoType && !organizationId);
    const isInstanceSSOOrganizationLogin = !!(!configId && ssoType && organizationId);

    if (configId) {
      // SSO under an organization
      ssoConfigs = await this.organizationService.getConfigs(configId);
      organization = ssoConfigs?.organization;
    } else if (isInstanceSSOOrganizationLogin) {
      // Instance SSO login from organization login page
      organization = await this.organizationService.fetchOrganizationDetails(organizationId, [true], false, true);
      ssoConfigs = organization?.ssoConfigs?.find((conf) => conf.sso === ssoType);
    } else if (isInstanceSSOLogin) {
      // Instance SSO login from common login page
      ssoConfigs = this.#getInstanceSSOConfigs(ssoType);
      organization = ssoConfigs?.organization;
    } else {
      throw new UnauthorizedException();
    }

    if ((isInstanceSSOLogin || isInstanceSSOOrganizationLogin) && ssoConfigs?.id) {
      // if instance sso login and sso configs returned stored in db, id will be present -> throwing error
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

    if (signUpInvitationToken && signupOrganizationId) {
      /* Validate the invite session. */
      const invitedUser = await this.organizationUsersService.findByWorkspaceInviteToken(signUpInvitationToken);
      if (invitedUser.email !== userResponse.email) {
        const { type, message, inputError } = SIGNUP_ERRORS.INCORRECT_INVITED_EMAIL;
        const errorResponse = {
          message: {
            message,
            type,
            inputError,
            inviteeEmail: invitedUser.email,
          },
        };
        throw new UnauthorizedException(errorResponse);
      }
    }

    if (!(userResponse.userSSOId && userResponse.email)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!isValidDomain(userResponse.email, domain)) {
      throw new UnauthorizedException(`You cannot sign in using the mail id - Domain verification failed`);
    }

    if (!userResponse.firstName) {
      // If firstName not found
      userResponse.firstName = userResponse.email?.split('@')?.[0];
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      let userDetails: User;
      let organizationDetails: DeepPartial<Organization>;

      const isInviteRedirect =
        redirectTo.startsWith('/organization-invitations/') || redirectTo.startsWith('/invitations/');

      if (isInstanceSSOLogin) {
        // Login from main login page - Multi-Workspace enabled
        userDetails = await this.usersService.findByEmail(userResponse.email);

        if (userDetails?.status === USER_STATUS.ARCHIVED) {
          throw new UnauthorizedException(getUserErrorMessages(userDetails.status));
        }

        if (!userDetails && enableSignUp) {
          // Create new user
          let defaultOrganization: DeepPartial<Organization> = organization;

          // Not logging in to specific organization, creating new
          const { name, slug } = generateNextNameAndSlug('My workspace');
          defaultOrganization = await this.organizationService.create(name, slug, null, manager);

          const groups = ['all_users', 'admin'];
          userDetails = await this.usersService.create(
            {
              firstName: userResponse.firstName,
              lastName: userResponse.lastName,
              email: userResponse.email,
              ...getUserStatusAndSource(lifecycleEvents.USER_SSO_VERIFY, sso),
            },
            defaultOrganization.id,
            groups,
            null,
            true,
            null,
            manager
          );

          await this.organizationUsersService.create(userDetails, defaultOrganization, true, manager);
          organizationDetails = defaultOrganization;
        } else if (userDetails) {
          // Finding organization to be loaded
          const organizationList: Organization[] = await this.organizationService.findOrganizationWithLoginSupport(
            userDetails,
            'sso',
            userDetails.invitationToken
              ? [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED]
              : WORKSPACE_USER_STATUS.ACTIVE
          );

          const defaultOrgDetails: Organization = organizationList?.find(
            (og) => og.id === userDetails.defaultOrganizationId
          );
          const personalWorkspaceCount = await this.organizationUsersService.personalWorkspaceCount(userDetails.id);

          if (defaultOrgDetails) {
            // default organization SSO login enabled
            organizationDetails = defaultOrgDetails;
          } else if (organizationList?.length > 0 && personalWorkspaceCount > 0) {
            // default organization SSO login not enabled, picking first one from SSO enabled list
            organizationDetails = organizationList[0];
          } else {
            if (!isInviteRedirect) {
              // no SSO login enabled organization available for user - creating new one
              const { name, slug } = generateNextNameAndSlug('My workspace');
              organizationDetails = await this.organizationService.create(name, slug, userDetails, manager);
              await this.usersService.updateUser(
                userDetails.id,
                { defaultOrganizationId: organizationDetails.id },
                manager
              );
            }
          }
        } else if (!userDetails) {
          throw new UnauthorizedException('User does not exist, please sign up');
        }
      } else {
        // workspace login
        userDetails = await this.usersService.findByEmail(userResponse.email, organization.id, [
          WORKSPACE_USER_STATUS.ACTIVE,
          WORKSPACE_USER_STATUS.INVITED,
        ]);

        if (userDetails?.status === USER_STATUS.ARCHIVED) {
          throw new UnauthorizedException(getUserErrorMessages(userDetails.status));
        }
        if (userDetails) {
          // user already exist
          if (
            !isInviteRedirect &&
            !userDetails.invitationToken &&
            userDetails.organizationUsers[0].status === WORKSPACE_USER_STATUS.INVITED
          ) {
            // user exists. onboarding completed, but invited status in the organization
            // Activating invited workspace
            await this.organizationUsersService.activateOrganization(userDetails.organizationUsers[0], manager);
          }
        } else if (!userDetails && enableSignUp) {
          userDetails = await this.#findOrCreateUser(userResponse, organization, manager);
        } else if (!userDetails) {
          throw new UnauthorizedException('User does not exist in the workspace');
        }
        organizationDetails = organization;

        userDetails = await this.usersService.findByEmail(
          userResponse.email,
          organization.id,
          [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED],
          manager
        );

        if (userDetails.invitationToken) {
          const updatableUserParams = {
            ...getUserStatusAndSource(lifecycleEvents.USER_SSO_ACTIVATE, sso),
            ...{ invitationToken: null },
            ...(!userDetails?.password && { password: uuid.v4() }), // Default password for sso-signed workspace user
          };

          // Activate the personal workspace if the user is invited to another organization
          const defaultOrganizationId = userDetails.defaultOrganizationId;
          const shouldActivatePersonalWorkspace =
            signUpInvitationToken &&
            signupOrganizationId &&
            defaultOrganizationId &&
            signupOrganizationId !== defaultOrganizationId;
          let personalWorkspace: Organization;
          if (shouldActivatePersonalWorkspace) {
            const defaultOrganizationUser = await this.organizationUsersService.getOrganizationUser(
              defaultOrganizationId
            );
            await this.organizationUsersService.activateOrganization(defaultOrganizationUser, manager);
            personalWorkspace = await this.organizationService.fetchOrganization(defaultOrganizationId);
          }

          // User account setup not done, updating source and status
          await this.usersService.updateUser(userDetails.id, updatableUserParams, manager);
          // New user created and invited to the organization
          const organizationToken = userDetails.organizationUsers?.find(
            (ou) => ou.organizationId === organization.id
          )?.invitationToken;

          return await this.authService.processOrganizationSignup(
            response,
            userDetails,
            { invitationToken: organizationToken, organizationId: organization.id },
            manager,
            personalWorkspace,
            'sso'
          );
        }
      }

      if (userDetails.invitationToken) {
        // User account setup not done, updating source and status
        await this.usersService.updateUser(
          userDetails.id,
          getUserStatusAndSource(lifecycleEvents.USER_SSO_VERIFY, sso),
          manager
        );
        return decamelizeKeys({
          redirectUrl: generateInviteURL(userDetails.invitationToken, null, null, URL_SSO_SOURCE),
        });
      }

      if (isInviteRedirect && userDetails.defaultOrganizationId) {
        /* Assign defaultOrganization instead of invited organization details */
        organizationDetails = await this.organizationService.fetchOrganization(userDetails.defaultOrganizationId);
      }

      return await this.authService.generateLoginResultPayload(
        response,
        userDetails,
        organizationDetails,
        isInstanceSSOLogin || isInstanceSSOOrganizationLogin,
        false,
        user,
        manager,
        isInviteRedirect ? loginOrganiaztionId : null
      );
    });
  }
}

interface SSOResponse {
  token: string;
  state?: string;
  organizationId?: string;
  signupOrganizationId?: string;
  invitationToken?: string;
  redirectTo?: string;
}
