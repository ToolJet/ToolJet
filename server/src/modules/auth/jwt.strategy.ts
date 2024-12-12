import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../src/services/users.service';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { USER_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { Request } from 'express';
import { SessionService } from '@services/session.service';
import { OrganizationUsersService } from '@services/organization_users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
    private sessionService: SessionService,
    private organizationUsersService: OrganizationUsersService
  ) {
    super({
      jwtFromRequest: (request) => {
        return request?.cookies['tj_auth_token'];
      },
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('SECRET_KEY_BASE'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JWTPayload) {
    const isUserMandatory = !req['isUserNotMandatory'];
    const isGetUserSession = !!req['isGetUserSession'];
    /* User is going through invite flow */
    const isInviteSession = !!req['isInviteSession'];

    if (isUserMandatory || isGetUserSession || isInviteSession) {
      await this.sessionService.validateUserSession(payload.username, payload.sessionId);
    }

    if (isGetUserSession) {
      const user: User = await this.usersService.findByEmail(payload.sub);
      user.organizationIds = payload.organizationIds;
      user.sessionId = payload.sessionId;
      return user;
    }

    const organizationId =
      typeof req.headers['tj-workspace-id'] === 'object'
        ? req.headers['tj-workspace-id'][0]
        : req.headers['tj-workspace-id'];

    if (isUserMandatory) {
      // header deos not exist
      if (!organizationId) return false;

      // No authenticated workspaces
      if (!payload.organizationIds?.length) {
        return false;
      }
      // requested workspace not authenticated
      if (!payload.organizationIds.some((oid) => oid === organizationId)) {
        /* If the organizationId isn't available in the jwt-payload */
        return false;
      }
    }

    let user: User;
    if (payload?.sub && organizationId && !isInviteSession) {
      /* Usual JWT case: user with valid organization id */
      user = await this.usersService.findByEmail(payload.sub, organizationId, WORKSPACE_USER_STATUS.ACTIVE);
      if (user) user.organizationId = organizationId;
    } else if (payload?.sub && isInviteSession) {
      /* Fetch user details for organization-invite and accept-invite route */
      user = await this.usersService.findOne({ email: payload?.sub, status: USER_STATUS.ACTIVE });
      user.organizationId = user.defaultOrganizationId;
    }

    if (user) {
      user.organizationIds = payload.organizationIds;
      user.isPasswordLogin = payload.isPasswordLogin;
      user.isSSOLogin = payload.isSSOLogin;
      user.sessionId = payload.sessionId;
      if (isInviteSession) user.invitedOrganizationId = payload.invitedOrganizationId;
    }

    return user;
  }
}

type JWTPayload = {
  sessionId: string;
  username: string;
  sub: string;
  organizationId?: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
  invitedOrganizationId?: string;
};
