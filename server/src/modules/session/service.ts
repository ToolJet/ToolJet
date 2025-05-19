import { BadRequestException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import {
  SOURCE,
  USER_STATUS,
  WORKSPACE_STATUS,
  WORKSPACE_USER_SOURCE,
  WORKSPACE_USER_STATUS,
} from '@modules/users/constants/lifecycle';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { Response } from 'express';
import { User } from 'src/entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { UserRepository } from '@modules/users/repository';
import { SessionUtilService } from './util.service';
import { AppsRepository } from '@modules/apps/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { fullName, generateOrgInviteURL, isSuperAdmin } from '@helpers/utils.helper';
import { decamelizeKeys } from 'humps';

@Injectable()
export class SessionService {
  constructor(
    protected readonly userRepository: UserRepository,
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly appsRepository: AppsRepository,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly organizationUserRepository: OrganizationUsersRepository
  ) {}

  async terminateSession(userId: string, sessionId: string, response: Response): Promise<void> {
    response.clearCookie('tj_auth_token');
    response.clearCookie('tj_embed_auth_token');
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserSessions, { id: sessionId, userId });
    });
  }

  async getSessionDetails(user: User, workspaceSlug: string, appId: string): Promise<any> {
    let appData: { organizationId: string; isPublic: boolean; isReleased: boolean };
    let currentOrganization: Organization;
    if (appId) {
      appData = await this.appsRepository.retrieveAppDataUsingSlug(appId);
    }

    if (workspaceSlug || appData?.organizationId) {
      const organization = await this.organizationRepository.fetchOrganization(workspaceSlug || appData.organizationId);
      if (!organization) {
        throw new NotFoundException("Coudn't found workspace. workspace id or slug is incorrect!.");
      }

      const activeMemberOfOrganization =
        (await this.organizationUserRepository.count({
          where: {
            userId: user.id,
            organizationId: organization.id,
            status: WORKSPACE_USER_STATUS.ACTIVE,
          },
        })) > 0;

      if (!appData?.isPublic || activeMemberOfOrganization || isSuperAdmin(user)) {
        currentOrganization = organization;
      }

      const alreadyWorkspaceSessionAvailable = user.organizationIds?.includes(appData?.organizationId);
      const orgIdNeedsToBeUpdatedForApplicationSession =
        appData && appData.organizationId !== user.defaultOrganizationId && alreadyWorkspaceSessionAvailable;

      if (orgIdNeedsToBeUpdatedForApplicationSession) {
        /* If the app's organization id is there in the JWT and user default organization id is different, then update it */
        await this.userRepository.updateOne(user.id, { defaultOrganizationId: appData.organizationId });
      }
    }
    return await this.sessionUtilService.generateSessionPayload(user, currentOrganization, appData);
  }

  async validateInvitedUserSession(user: User, invitedUser: any, tokens: any) {
    const { accountToken, organizationToken } = tokens;
    const {
      email,
      firstName,
      lastName,
      status: invitedUserStatus,
      organizationStatus,
      organizationUserSource,
      invitedOrganizationId,
      source,
    } = invitedUser;
    const organizationAndAccountInvite = !!organizationToken && !!accountToken;
    const accountYetToActive =
      organizationAndAccountInvite &&
      [USER_STATUS.INVITED, USER_STATUS.VERIFIED].includes(invitedUserStatus as USER_STATUS);
    const invitedOrganization = await this.organizationRepository.fetchOrganization(
      invitedUser['invitedOrganizationId']
    );

    if (!invitedOrganization || invitedOrganization.status !== WORKSPACE_STATUS.ACTIVE) {
      throw new BadRequestException('Organization is Archived');
    }
    const { name: invitedOrganizationName, slug: invitedOrganizationSlug } = invitedOrganization;

    if (accountYetToActive) {
      /* User has invite url which got after the workspace signup */
      const isInstanceSignupInvite = !!accountToken && !organizationToken && source === SOURCE.SIGNUP;
      const isOrganizationSignupInvite = organizationAndAccountInvite && source === SOURCE.WORKSPACE_SIGNUP;
      if (isInstanceSignupInvite || isOrganizationSignupInvite) {
        const responseObj = {
          email,
          name: fullName(firstName, lastName),
          invitedOrganizationName,
          isWorkspaceSignUpInvite: true,
          source,
        };
        return decamelizeKeys(responseObj);
      }

      const errorResponse = {
        message: {
          error: 'Account is not activated yet',
          isAccountNotActivated: true,
          inviteeEmail: invitedUser.email,
          redirectPath: `/signup/${invitedOrganizationSlug ?? invitedOrganizationId}`,
        },
      };
      throw new NotAcceptableException(errorResponse);
    }

    const isWorkspaceSignup =
      organizationStatus === WORKSPACE_USER_STATUS.INVITED &&
      !!organizationToken &&
      invitedUserStatus === USER_STATUS.ACTIVE &&
      organizationUserSource === WORKSPACE_USER_SOURCE.SIGNUP;
    if (isWorkspaceSignup) {
      /* Active user & Organization invite */
      const responseObj = {
        organizationUserSource,
      };
      return decamelizeKeys(responseObj);
    }
    /* Send back the organization invite url if the user has old workspace + account invitation URL */
    const doesUserHaveWorkspaceAndAccountInvite =
      organizationAndAccountInvite &&
      [USER_STATUS.ACTIVE].includes(invitedUserStatus as USER_STATUS) &&
      organizationStatus === WORKSPACE_USER_STATUS.INVITED;
    const organizationInviteUrl = doesUserHaveWorkspaceAndAccountInvite
      ? generateOrgInviteURL(organizationToken, invitedOrganizationId, false)
      : null;

    const organizationId = user?.organizationId || user?.defaultOrganizationId;
    const noActiveWorkspaces = await this.sessionUtilService.checkUserWorkspaceStatus(user.id);
    let activeOrganization: Organization;
    if (!noActiveWorkspaces) {
      activeOrganization = organizationId ? await this.organizationRepository.fetchOrganization(organizationId) : null;
    }

    // if (!activeOrganization || activeOrganization.status !== WORKSPACE_STATUS.ACTIVE) {
    //   throw new BadRequestException('Organization is Archived');
    // }

    const payload = await this.sessionUtilService.generateSessionPayload(user, activeOrganization);
    const responseObj = {
      ...payload,
      invitedOrganizationName,
      noActiveWorkspaces,
      name: fullName(user['firstName'], user['lastName']),
      ...(organizationInviteUrl && { organizationInviteUrl }),
    };
    return decamelizeKeys(responseObj);
  }
}
