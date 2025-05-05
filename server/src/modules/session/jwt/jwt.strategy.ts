import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { Request } from 'express';
import { UserRepository } from '@modules/users/repository';
import { SessionUtilService } from '../util.service';
import { JWTPayload } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly userRepository: UserRepository
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
    const isGettingOrganizations = !!req['isGettingOrganizations'];
    const bypassOrganizationValidation = !req['isFetchingOrganization'] && !req['isSwitchingOrganization'];
    /* User is going through invite flow */
    const isInviteSession = !!req['isInviteSession'];

    if (isUserMandatory || isGetUserSession || isInviteSession) {
      await this.sessionUtilService.validateUserSession(payload.username, payload.sessionId);
    }

    if (isGetUserSession) {
      const user: User = await this.userRepository.findByEmail(payload.sub);
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
      const archivedWorkspaceUser = isGettingOrganizations || req['isSwitchingOrganization'];
      user = await this.userRepository.findByEmail(payload.sub, archivedWorkspaceUser ? null : organizationId, WORKSPACE_USER_STATUS.ACTIVE);
      if (bypassOrganizationValidation) {
        await this.sessionUtilService.findOrganization(organizationId);
      }
      if (user) {
        user.organizationId = organizationId;
      } else {
        await this.sessionUtilService.handleUnauthorizedUser(payload, organizationId);
      }
    } else if (payload?.sub && isInviteSession) {
      /* Fetch user details for organization-invite and accept-invite route */
      user = await this.sessionUtilService.findActiveUser(payload?.sub);
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
