import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { decamelizeKeys } from 'humps';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { EntityManager } from 'typeorm';
import { WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { isSuperAdmin, generateNextNameAndSlug } from 'src/helpers/utils.helper';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { Response } from 'express';
import { AppAuthenticationDto } from './dto';
const uuid = require('uuid');
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganizationRepository } from '@modules/organizations/repository';
import { EMAIL_EVENTS } from '@modules/email/constants';
import { UserRepository } from '../users/repository';
import { AuthUtilService } from './util.service';
import { SessionUtilService } from '../session/util.service';
import { IAuthService } from './interfaces/IService';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    protected userRepository: UserRepository,
    protected authUtilService: AuthUtilService,
    protected sessionUtilService: SessionUtilService,
    protected organizationRepository: OrganizationRepository,
    protected instanceSettingsUtilService: InstanceSettingsUtilService,
    protected setupOrganizationsUtilService: SetupOrganizationsUtilService,
    protected eventEmitter: EventEmitter2
  ) {}

  async login(
    response: Response,
    appAuthDto: AppAuthenticationDto,
    organizationId?: string | undefined,
    loggedInUser?: User
  ) {
    let organization: Organization;
    const { email, password, redirectTo } = appAuthDto;
    let invitingOrganizationId: string | undefined;

    const isInviteRedirect =
      redirectTo?.startsWith('/organization-invitations/') || redirectTo?.startsWith('/invitations/');

    let user: User;
    if (isInviteRedirect) {
      invitingOrganizationId = organizationId;
      /* give access to the default organization */
      user = await this.userRepository.findByEmail(email, organizationId, [WORKSPACE_USER_STATUS.INVITED]);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      organizationId = undefined;
    } else {
      user = await this.authUtilService.validateLoginUser(email, password, organizationId);
    }

    const allowPersonalWorkspace =
      isSuperAdmin(user) ||
      (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) === 'true';

    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!organizationId) {
        // Global login
        // Determine the organization to be loaded

        const organizationList: Organization[] = await this.organizationRepository.findOrganizationWithLoginSupport(
          user,
          'form'
        );

        const defaultOrgDetails: Organization = organizationList?.find((og) => og.id === user.defaultOrganizationId);
        if (defaultOrgDetails) {
          // default organization form login enabled
          organization = defaultOrgDetails;
        } else if (organizationList?.length > 0) {
          // default organization form login not enabled, picking first one from form enabled list
          organization = organizationList[0];
        } else if (allowPersonalWorkspace && !isInviteRedirect) {
          // no form login enabled organization available for user - creating new one
          const { name, slug } = generateNextNameAndSlug('My workspace');
          organization = await this.setupOrganizationsUtilService.create({ name, slug }, user, manager);
        } else {
          if (!isInviteRedirect) throw new UnauthorizedException('User is not assigned to any workspaces');
        }

        if (organization) user.organizationId = organization.id;
        /* CASE: No active workspace. But one workspace with invited status. waiting for activation */
        if (isInviteRedirect && !organization) user.organizationId = invitingOrganizationId ?? '';
      } else {
        // organization specific login
        // No need to validate user status, validateUser() already covers it
        user.organizationId = organizationId;

        organization = await this.organizationRepository.get(user.organizationId);

        const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

        if (!formConfigs?.enabled) {
          // no configurations in organization side or Form login disabled for the organization
          throw new UnauthorizedException('Password login is disabled for the organization');
        }
      }

      const shouldUpdateDefaultOrgId =
        user.defaultOrganizationId && user.organizationId && user.defaultOrganizationId !== user.organizationId;
      const updateData = {
        ...(shouldUpdateDefaultOrgId && { defaultOrganizationId: organization?.id }),
        passwordRetryCount: 0,
        forgotPasswordToken: null,
      };

      await this.userRepository.updateOne(user.id, updateData, manager);

      if (!isInviteRedirect) {
        RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
          userId: user.id,
          organizationId: organization.id,
          resourceId: user.id,
          resourceName: user.email,
          resourceData: {
            auth_method: 'password',
          },
        });
      }

      return await this.sessionUtilService.generateLoginResultPayload(
        response,
        user,
        organization,
        false,
        true,
        loggedInUser,
        manager
      );
    });
  }

  //TODO:this function is not used now
  async authorizeOrganization(user: User) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (user.defaultOrganizationId !== user.organizationId)
        await this.userRepository.updateOne(user.id, { defaultOrganizationId: user.organizationId }, manager);

      const organization = await this.organizationRepository.get(user.organizationId);

      const permissionData = await this.sessionUtilService.getPermissionDataToAuthorize(user, manager);

      return decamelizeKeys({
        currentOrganizationId: user.organizationId,
        currentOrganizationSlug: organization.slug,
        currentOrganizationName: organization.name,
        currentUser: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarId: user.avatarId,
          ssoUserInfo: permissionData.ssoUserInfo,
          metadata: permissionData.metadata,
          createdAt: user.createdAt,
        },
        ...permissionData,
      });
    });
  }

  async switchOrganization(response: Response, newOrganizationId: string, user: User, isNewOrganization?: boolean) {
    return await this.sessionUtilService.switchOrganization(response, newOrganizationId, user, isNewOrganization);
  }

  async resetPassword(token: string, password: string) {
    const user = await this.userRepository.getUser({ forgotPasswordToken: token });
    if (!user) {
      throw new NotFoundException(
        'Invalid Reset Password URL. Please ensure you have the correct URL for resetting your password.'
      );
    } else {
      await this.userRepository.updateOne(user.id, {
        password,
        forgotPasswordToken: null,
        passwordRetryCount: 0,
      });
      const auditLogEntry = {
        userId: user.id,
        organizationId: user.defaultOrganizationId,
        resourceId: user.id,
        resourceName: user.email,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogEntry);
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // No need to throw error - To prevent Username Enumeration vulnerability
      return;
    }
    const forgotPasswordToken = uuid.v4();
    await this.userRepository.updateOne(user.id, { forgotPasswordToken });
    const auditLogEntry = {
      userId: user.id,
      organizationId: user.defaultOrganizationId,
      resourceId: user.id,
      resourceName: user.email,
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogEntry);
    this.eventEmitter.emit('emailEvent', {
      type: EMAIL_EVENTS.SEND_PASSWORD_RESET_EMAIL,
      payload: {
        to: email,
        token: forgotPasswordToken,
        firstName: user.firstName,
      },
    });
  }

  async superAdminLogin(response: Response, appAuthDto: AppAuthenticationDto) {
    const { email } = appAuthDto;
    const user = await this.userRepository.findByEmail(email);

    if (!user || !isSuperAdmin(user)) {
      throw new UnauthorizedException('Only super admin can login through this url');
    }

    return this.login(response, appAuthDto);
  }
}
