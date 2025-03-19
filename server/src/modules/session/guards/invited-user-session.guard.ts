import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Organization } from '@entities/organization.entity';
import { SSOConfigs } from '@entities/sso_config.entity';
import {
  getUserErrorMessages,
  SOURCE,
  USER_STATUS,
  WORKSPACE_STATUS,
  WORKSPACE_USER_SOURCE,
} from '@modules/users/constants/lifecycle';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { InvitedUserType } from '@modules/organization-users/types';

/* 
This guard will check all possible cases to reject an invalid invitation session request
- Request obj will have 2 users details if the session is valid
   1. JWT user
   2. Invited user
*/
@Injectable()
export class InvitedUserSessionAuthGuard extends AuthGuard('jwt') {
  constructor(
    private organizationUserRepository: OrganizationUsersRepository,
    private organizationRepository: OrganizationRepository
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const workspaceInviteToken = request.body.organizationToken;
    let isValidUser: any;

    if (!workspaceInviteToken) {
      throw new BadRequestException(
        'The workspace invite token is missing from the request parameters. Please provide a valid token to proceed.'
      );
    }

    const invitedUser = await this.organizationUserRepository.findByInvitationToken(workspaceInviteToken);

    const user: InvitedUserType = invitedUser?.user;
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
    user.invitedOrganizationId = invitedUser.organizationId;
    user.organizationStatus = invitedUser.status;
    user.organizationUserSource = invitedUser.source;

    const { email: invitedUserEmail, status: invitedUserStatus, organization } = invitedUser.user;

    if (organization?.status === WORKSPACE_STATUS.ARCHIVE) {
      /* Invited workspace is archive */
      const errorResponse = {
        message: {
          error: 'The workspace is archived. Please contact the super admin to get access.',
          isWorkspaceArchived: true,
        },
      };
      throw new BadRequestException(errorResponse);
    }

    request.invitedUser = user;

    const isOrganizationOnlyInvite = !!workspaceInviteToken && !request.body.accountToken;
    if (isOrganizationOnlyInvite && invitedUserStatus !== USER_STATUS.ACTIVE) {
      /* User has the organization token, But the account isn't activated yet */
      const errorResponse = {
        message: {
          error: getUserErrorMessages(invitedUserStatus),
          accountIsNotActivatedYet: true,
        },
      };
      throw new BadRequestException(errorResponse);
    }

    try {
      request.isUserNotMandatory = true;
      request.isInviteSession = true;
      isValidUser = await super.canActivate(context);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        /* No valid session / Expired token */
        return this.onInvalidSession(invitedUser, request.body.accountToken);
      }
      throw new BadRequestException(
        'Invalid or expired invitation session. Please check your invitation and try again.'
      );
    }

    if (isValidUser) {
      /* Check if the same user is accepting invite or not */
      /* Only for a valid session (Activated user) */
      if (request.user?.email !== invitedUserEmail) {
        const errorResponse = {
          message: {
            error:
              'Your session does not match the invited user. Please logout and login to the invited user email account.',
            isInvitationTokenAndUserMismatch: true,
          },
        };
        throw new ForbiddenException(errorResponse);
      }
    }

    if (request?.user) {
      /* Already a session is going on for the user. Check the login methods of user against invited workspace */
      const user = request.user;
      const organization: Organization = await this.organizationRepository.get(invitedUser.user.invitedOrganizationId);
      const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

      const isCompatibleWithUserLogin = user.isPasswordLogin && !formConfigs?.enabled;
      if (isCompatibleWithUserLogin && user.invitedOrganizationId !== organization.id) {
        // no configurations in organization side or Form login disabled for the organization
        const errorResponse = {
          message: {
            invitedOrganizationSlug: organization?.slug || invitedUser.user.invitedOrganizationId,
          },
        };
        throw new ForbiddenException(errorResponse);
      }
    }

    return isValidUser;
  }

  async onInvalidSession(invitedUser: any, accountToken: string) {
    const { status, source: organizationUserSource } = invitedUser;
    if (accountToken && [USER_STATUS.INVITED, USER_STATUS.VERIFIED].includes(status as USER_STATUS)) {
      /* User doesn't have a valid session & User didn't activate account yet */
      return invitedUser;
    } else {
      //by-pass 401 check for organization invite url / organization and account url + source from workspace signup
      if (organizationUserSource === WORKSPACE_USER_SOURCE.SIGNUP) {
        return invitedUser;
      }
      /* User doesn't have a session. Next?: login again and accept invite */
      const organization = await this.organizationRepository.fetchOrganization(invitedUser.organizationId);

      if (!organization || organization.status !== WORKSPACE_STATUS.ACTIVE) {
        throw new BadRequestException('Organization is Archived');
      }
      const errorResponse = {
        message: {
          invitedOrganizationSlug: organization?.slug || invitedUser.invitedOrganizationId,
        },
      };
      throw new ForbiddenException(errorResponse);
    }
  }
}
