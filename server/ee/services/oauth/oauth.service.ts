import { Injectable, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@services/auth.service';
import { OrganizationsService } from '@services/organizations.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { OidcOAuthService } from './oidc_auth.service';
import { decamelizeKeys } from 'humps';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { SSOConfigs, SSOType } from 'src/entities/sso_config.entity';
import { User } from 'src/entities/user.entity';
import {
  getUserErrorMessages,
  getUserStatusAndSource,
  USER_STATUS,
  lifecycleEvents,
  URL_SSO_SOURCE,
  WORKSPACE_USER_STATUS,
} from 'src/helpers/user_lifecycle';
import {
  dbTransactionWrap,
  generateInviteURL,
  isSuperAdmin,
  generateNextNameAndSlug,
  isValidDomain,
} from 'src/helpers/utils.helper';
import { DeepPartial, EntityManager } from 'typeorm';
import { GitOAuthService } from './git_oauth.service';
import { GoogleOAuthService } from './google_oauth.service';
import UserResponse from './models/user_response';
import { InstanceSettingsService } from '@services/instance_settings.service';
import { Response } from 'express';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { LdapService } from './ldap.service';
import { SAMLService } from './saml.service';
import { INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';
import { InstanceSSOConfigMap } from '@services/organizations.service';
import { INSTANCE_SYSTEM_SETTINGS } from 'src/helpers/instance_settings.constants';
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
    private readonly oidcOAuthService: OidcOAuthService,
    private readonly instanceSettingsService: InstanceSettingsService,
    private readonly licenseService: LicenseService,
    private readonly ldapService: LdapService,
    private readonly samlService: SAMLService,
    private configService: ConfigService
  ) {}

  async #findOrCreateUser(
    { firstName, lastName, email, sso, groups: ssoGroups, profilePhoto }: any,
    organization: DeepPartial<Organization>,
    manager?: EntityManager
  ): Promise<User> {
    // User not exist in the workspace, creating
    let user: User;
    let defaultOrganization: Organization;
    user = await this.usersService.findByEmail(email);

    const allowPersonalWorkspace =
      (await this.instanceSettingsService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';

    const organizationUser: OrganizationUser = user?.organizationUsers?.find(
      (ou) => ou.organizationId === organization.id
    );

    if (organizationUser?.status === WORKSPACE_USER_STATUS.ARCHIVED) {
      throw new UnauthorizedException('User does not exist in the workspace');
    }

    if (!user && allowPersonalWorkspace) {
      const { name, slug } = generateNextNameAndSlug('My workspace');
      defaultOrganization = await this.organizationService.create(name, slug, null, manager);
    }

    const groups = ['all_users', ...(ssoGroups ? ssoGroups : [])];
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

    /* Create avatar if profilePhoto available */
    if (profilePhoto) {
      try {
        await this.usersService.addAvatar(user.id, profilePhoto, `${email}.jpeg`, manager);
      } catch (error) {
        /* Should not break the flow */
        console.log('Profile picture upload failed', error);
      }
    }

    // Setting up invited organization, organization user status should be invited if user status is invited
    await this.organizationUsersService.create(user, organization, !!user.invitationToken, manager);

    if (defaultOrganization) {
      // Setting up default organization
      await this.organizationUsersService.create(user, defaultOrganization, true, manager);
      await this.usersService.attachUserGroup(['all_users', 'admin'], defaultOrganization.id, user.id, false, manager);
    }
    return user;
  }

  async getSSOConfigs(ssoType: SSOType.GOOGLE | SSOType.GIT | SSOType.OPENID): Promise<Partial<SSOConfigs>> {
    const ssoConfigs = await this.organizationService.getInstanceSSOConfigs();
    const oidcEnabled = await this.licenseService.getLicenseTerms(LICENSE_FIELD.OIDC);

    // Create a map from the ssoConfigs array
    const ssoConfigMap: InstanceSSOConfigMap = {};
    ssoConfigs.forEach((config) => {
      ssoConfigMap[config.sso] = {
        enabled: config.enabled,
        configs: config.configs,
      };
    });

    switch (ssoType) {
      case SSOType.GOOGLE:
        return {
          enabled: ssoConfigMap.google.enabled || false,
          configs: ssoConfigMap.google.configs || {},
        };
      case SSOType.GIT:
        return {
          enabled: ssoConfigMap.git.enabled || false,
          configs: ssoConfigMap.git.configs || {},
        };
      case SSOType.OPENID:
        return {
          enabled: ssoConfigMap.openid.enabled && oidcEnabled,
          configs: ssoConfigMap.openid.configs || {},
        };
      default:
        return;
    }
  }

  async getInstanceSSOConfigs(
    ssoType: SSOType.GOOGLE | SSOType.GIT | SSOType.OPENID
  ): Promise<DeepPartial<SSOConfigs>> {
    const instanceSettings = await this.instanceSettingsService.getSettings([
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
      samlResponseId,
    } = ssoResponse;
    let ssoConfigs: DeepPartial<SSOConfigs>;
    let organization: DeepPartial<Organization>;
    const organizationId = loginOrganiaztionId || signupOrganizationId;
    const isInstanceSSOLogin = !!(!configId && ssoType && !organizationId);
    const isInstanceSSOOrganizationLogin = !!(!configId && ssoType && organizationId);
    //Specific SSO configId from organization SSO Configs
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
      ssoConfigs = await this.getInstanceSSOConfigs(ssoType);
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
    const { token, username, password } = ssoResponse;

    let userResponse: UserResponse;
    switch (sso) {
      case SSOType.GOOGLE:
        userResponse = await this.googleOAuthService.signIn(token, configs);
        break;

      case SSOType.GIT:
        userResponse = await this.gitOAuthService.signIn(token, configs);
        break;

      case SSOType.OPENID:
        if (!(await this.licenseService.getLicenseTerms(LICENSE_FIELD.OIDC))) {
          throw new UnauthorizedException('OIDC login disabled');
        }
        userResponse = await this.oidcOAuthService.signIn(token, {
          ...configs,
          configId,
          codeVerifier: cookies['oidc_code_verifier'],
        });
        break;

      case 'ldap':
        if (!(await this.licenseService.getLicenseTerms(LICENSE_FIELD.LDAP))) {
          throw new UnauthorizedException('Ldap login disabled');
        }
        userResponse = await this.ldapService.signIn({ username, password }, configs);
        break;

      case 'saml':
        userResponse = await this.samlService.signIn(samlResponseId, configs, configId);
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

    userResponse.email = userResponse.email.toLowerCase();

    let userDetails: User = await this.usersService.findByEmail(userResponse.email);

    if (userDetails?.status === 'archived') {
      throw new NotAcceptableException('User has been archived, please contact the administrator');
    }

    if (!isSuperAdmin(userDetails) && isValidDomain(userResponse.email, domain)) {
      throw new UnauthorizedException(`You cannot sign in using the mail id - Domain verification failed`);
    }

    if (!userResponse.firstName) {
      // If firstName not found
      userResponse.firstName = userResponse.email?.split('@')?.[0];
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      let organizationDetails: DeepPartial<Organization>;
      const allowPersonalWorkspace =
        isSuperAdmin(userDetails) ||
        (await this.instanceSettingsService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';

      const isInviteRedirect =
        redirectTo?.startsWith('/organization-invitations/') || redirectTo?.startsWith('/invitations/');

      if (isInstanceSSOLogin) {
        // Login from main login page - Multi-Workspace enabled

        if (userDetails?.status === USER_STATUS.ARCHIVED) {
          throw new UnauthorizedException(getUserErrorMessages(userDetails.status));
        }

        if (!userDetails && enableSignUp && allowPersonalWorkspace) {
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
          } else if (allowPersonalWorkspace) {
            // no SSO login enabled organization available for user - creating new one
            const { name, slug } = generateNextNameAndSlug('My workspace');
            organizationDetails = await this.organizationService.create(name, slug, userDetails, manager);
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

            throw new UnauthorizedException(
              'User not included in any workspace or workspace does not supports SSO login'
            );
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
          }

          if (defaultOrganizationId) {
            personalWorkspace = await this.organizationService.fetchOrganization(defaultOrganizationId, manager);
          }

          // User account setup not done, updating source and status
          await this.usersService.updateUser(userDetails.id, updatableUserParams, manager);
          // New user created and invited to the organization
          const organizationToken = userDetails.organizationUsers?.find(
            (ou) => ou.organizationId === organization.id
          )?.invitationToken;

          if (userResponse.userinfoResponse) {
            // update sso user info
            await this.usersService.updateSSOUserInfo(manager, userDetails.id, userResponse.userinfoResponse);
          }
          return await this.validateLicense(
            this.authService.processOrganizationSignup(
              response,
              userDetails,
              { invitationToken: organizationToken, organizationId: organization.id },
              manager,
              personalWorkspace,
              'sso'
            ),
            manager
          );
        }
      }

      if (userResponse.userinfoResponse) {
        // update sso user info
        await this.usersService.updateSSOUserInfo(manager, userDetails.id, userResponse.userinfoResponse);
      }

      if (userDetails.invitationToken) {
        // User account setup not done, updating source and status
        await this.usersService.updateUser(
          userDetails.id,
          getUserStatusAndSource(lifecycleEvents.USER_SSO_VERIFY, sso),
          manager
        );
        return await this.validateLicense(
          decamelizeKeys({
            redirectUrl: generateInviteURL(userDetails.invitationToken, null, null, URL_SSO_SOURCE),
          }),
          manager
        );
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
        manager
      );
    });
  }
  private async validateLicense(response: any, manager: EntityManager) {
    await this.usersService.validateLicense(manager);
    return response;
  }
}

interface SSOResponse {
  token: string;
  state?: string;
  username?: string;
  password?: string;
  codeVerifier?: string;
  organizationId?: string;
  samlResponseId?: string;
  signupOrganizationId?: string;
  invitationToken?: string;
  redirectTo?: string;
}
