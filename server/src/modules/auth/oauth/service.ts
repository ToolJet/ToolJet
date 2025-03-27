import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OidcOAuthService } from './util-services/oidc-auth.service';
import { decamelizeKeys } from 'humps';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs, SSOType } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import {
  getUserErrorMessages,
  getUserStatusAndSource,
  USER_STATUS,
  lifecycleEvents,
  URL_SSO_SOURCE,
  WORKSPACE_USER_STATUS,
} from '@modules/users/constants/lifecycle';
import { generateInviteURL, generateNextNameAndSlug, isValidDomain } from 'src/helpers/utils.helper';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { DeepPartial, EntityManager } from 'typeorm';
import { GitOAuthService } from './util-services/git-oauth.service';
import { GoogleOAuthService } from './util-services/google-oauth.service';
import UserResponse from './models/user_response';
import { Response } from 'express';
import { LdapService } from './util-services/ldap.service';
import { SamlService } from './util-services/saml.service';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { SIGNUP_ERRORS } from 'src/helpers/errors.constants';
import { SSOResponse } from './interfaces/ISSOResponse';
import { IOAuthService } from './interfaces/IOAuthService';
import { LoginConfigsUtilService } from '@modules/login-configs/util.service';
import { AuthUtilService } from '@modules/auth/util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { OrganizationUsersUtilService } from '@modules/organization-users/util.service';
import { UserRepository } from '@modules/users/repository';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { OnboardingUtilService } from '@modules/onboarding/util.service';
import { SessionUtilService } from '@modules/session/util.service';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';
const uuid = require('uuid');

@Injectable()
export class OauthService implements IOAuthService {
  constructor(
    protected readonly googleOAuthService: GoogleOAuthService,
    protected readonly gitOAuthService: GitOAuthService,
    protected readonly oidcOAuthService: OidcOAuthService,
    protected readonly ldapService: LdapService,
    protected readonly samlService: SamlService,
    protected readonly loginConfigsUtilService: LoginConfigsUtilService,
    protected readonly authUtilService: AuthUtilService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly organizationUsersUtilService: OrganizationUsersUtilService,
    protected readonly userRepository: UserRepository,
    protected readonly instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly organizationUsersRepository: OrganizationUsersRepository,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly onboardingUtilService: OnboardingUtilService,
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService
  ) {}

  async signIn(
    response: Response,
    ssoResponse: SSOResponse,
    configId?: string,
    ssoType?: SSOType.GOOGLE | SSOType.GIT,
    user?: User,
    cookies?: object
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
      ssoConfigs = await this.loginConfigsUtilService.getConfigs(configId);
      organization = ssoConfigs?.organization;
    } else if (isInstanceSSOOrganizationLogin) {
      // Instance SSO login from organization login page
      organization = await this.loginConfigsUtilService.fetchOrganizationDetails(organizationId, [true], false, true);
      ssoConfigs = organization?.ssoConfigs?.find((conf) => conf.sso === ssoType);
    } else if (isInstanceSSOLogin) {
      // Instance SSO login from common login page
      ssoConfigs = await this.authUtilService.getInstanceSSOConfigsOfType(ssoType);
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
      const invitedUser = await this.organizationUsersUtilService.findByWorkspaceInviteToken(signUpInvitationToken);
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
        redirectTo?.startsWith('/organization-invitations/') || redirectTo?.startsWith('/invitations/');

      if (isInstanceSSOLogin) {
        // Login from main login page - Multi-Workspace enabled
        userDetails = await this.userRepository.findByEmail(userResponse.email);

        if (userDetails?.status === USER_STATUS.ARCHIVED) {
          throw new UnauthorizedException(getUserErrorMessages(userDetails.status));
        }

        if (!userDetails && enableSignUp) {
          // Create new user
          let defaultOrganization: DeepPartial<Organization> = organization;

          // Not logging in to specific organization, creating new
          const { name, slug } = generateNextNameAndSlug('My workspace');
          defaultOrganization = await this.setupOrganizationsUtilService.create({ name, slug }, null, manager);

          userDetails = await this.userRepository.createOrUpdate(
            {
              firstName: userResponse.firstName,
              lastName: userResponse.lastName,
              email: userResponse.email,
              defaultOrganizationId: defaultOrganization.id,
              ...getUserStatusAndSource(lifecycleEvents.USER_SSO_ACTIVATE, sso),
            },
            manager
          );
          await this.organizationUsersRepository.createOne(userDetails, defaultOrganization, false, manager);
          await this.organizationUsersUtilService.attachUserGroup(
            [USER_ROLE.ADMIN],
            defaultOrganization.id,
            userDetails.id,
            manager
          );

          organizationDetails = defaultOrganization;
        } else if (userDetails) {
          // Finding organization to be loaded
          const organizationList: Organization[] = await this.organizationRepository.findOrganizationWithLoginSupport(
            userDetails,
            'sso',
            userDetails.invitationToken
              ? [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED]
              : WORKSPACE_USER_STATUS.ACTIVE
          );

          const defaultOrgDetails: Organization = organizationList?.find(
            (og) => og.id === userDetails.defaultOrganizationId
          );
          const personalWorkspaceCount = await this.organizationUsersUtilService.personalWorkspaceCount(userDetails.id);

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
              organizationDetails = await this.setupOrganizationsUtilService.create({ name, slug }, null, manager);
              await this.userRepository.updateOne(
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
        userDetails = await this.userRepository.findByEmail(userResponse.email, organization.id, [
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
            await this.organizationUsersUtilService.activateOrganization(userDetails.organizationUsers[0], manager);
          }
        } else if (!userDetails && enableSignUp) {
          userDetails = await this.authUtilService.findOrCreateUser(userResponse, organization, manager);
        } else if (!userDetails) {
          throw new UnauthorizedException('User does not exist in the workspace');
        }
        organizationDetails = organization;

        userDetails = await this.userRepository.findByEmail(
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
            const defaultOrganizationUser = await this.organizationUsersRepository.getOrganizationUser(
              defaultOrganizationId
            );
            await this.organizationUsersUtilService.activateOrganization(defaultOrganizationUser, manager);
          }

          if (defaultOrganizationId) {
            personalWorkspace = await this.organizationRepository.fetchOrganization(defaultOrganizationId, manager);
          }

          // User account setup not done, updating source and status
          await this.userRepository.updateOne(userDetails.id, updatableUserParams, manager);
          // New user created and invited to the organization
          const organizationToken = userDetails.organizationUsers?.find(
            (ou) => ou.organizationId === organization.id
          )?.invitationToken;

          return await this.onboardingUtilService.processOrganizationSignup(
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
        await this.userRepository.updateOne(
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
        organizationDetails = await this.organizationRepository.fetchOrganization(userDetails.defaultOrganizationId);
      }

      // Clear forgot password token
      if (userDetails.forgotPasswordToken) {
        await this.userRepository.updateOne(userDetails.id, { forgotPasswordToken: null }, manager);
      }

      return await this.sessionUtilService.generateLoginResultPayload(
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

  async handleOIDCConfigs(response: Response, configId: string): Promise<{ authorizationUrl: string }> {
    throw new Error('Method not implemented');
  }

  async getSAMLAuthorizationURL(configId: string) {
    throw new Error('Method not implemented');
  }

  async saveSAMLResponse(configId: string, response: string) {
    throw new Error('Method not implemented');
  }
}
