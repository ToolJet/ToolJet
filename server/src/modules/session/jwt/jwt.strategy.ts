import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { Request } from 'express';
import { UserRepository } from '@modules/users/repositories/repository';
import { SessionUtilService } from '../util.service';
import { JWTPayload } from '../types';
import { ForbiddenException } from '@nestjs/common';
import { UserSessionRepository } from '@modules/session/repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly userRepository: UserRepository,
    protected readonly sessionRepository: UserSessionRepository
  ) {
    super({
      jwtFromRequest: (request: Request) => {
        // Ensure PAT is processed correctly without bypassing JWT validation
        if (request.headers['x-embed-pat']) {
          console.log('Found x-embed-pat header:', request.headers['x-embed-pat']);
          return request.headers['x-embed-pat']; // Return null to bypass JWT token, but PAT will still be handled
        }
        console.log('Found auth token:', request.cookies['tj_auth_token']);
        return request.cookies['tj_auth_token'];
      },
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('SECRET_KEY_BASE'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JWTPayload | null) {
    const isUserMandatory = !req['isUserNotMandatory'];
    const isGetUserSession = !!req['isGetUserSession'];
    const isGettingOrganizations = !!req['isGettingOrganizations'];
    const bypassOrganizationValidation = !req['isFetchingOrganization'] && !req['isSwitchingOrganization'];
    /* User is going through invite flow */
    const isInviteSession = !!req['isInviteSession'];

    //Pat validation for embed app
    const patHeader = req.headers['x-embed-pat'];
    if (typeof patHeader === 'string') {
      let patPayload: {
        token: string;
        userId: string;
        workspaceId: string;
        appId: string;
        scope: 'app' | 'workspace';
        sessionType: 'pat';
      };

      try {
        patPayload = JSON.parse(patHeader);
      } catch {
        throw new ForbiddenException('Malformed PAT header');
      }

      const session = await this.sessionRepository.findOne({
        where: {
          pat: {
            tokenHash: patPayload.token,
            user: { id: patPayload.userId },
            app: { id: patPayload.appId },
          },
        },
        relations: ['pat'],
      });

      if (!session || !session.pat) {
        throw new ForbiddenException('Invalid or expired PAT session');
      }

      const now = new Date();
      if (session.pat.expiresAt < now) throw new ForbiddenException('PAT has expired');
      if (session.expiry < now) throw new ForbiddenException('Session has expired');

      const user = await this.userRepository.getUser({ id: patPayload.userId }, undefined, [
        'organizationUsers',
        'organizationUsers.organization',
      ]);

      const orgIds = user.organizationUsers.map((ou) => ou.organizationId);
      user.organizationIds = patPayload.scope === 'app' ? [patPayload.workspaceId] : orgIds;
      user.organizationId = patPayload.workspaceId;
      user.sessionId = session.id;
      user.isPasswordLogin = false;
      user.isSSOLogin = false;

      return user;
    }

    if (isUserMandatory || isGetUserSession || isInviteSession) {
      await this.sessionUtilService.validateUserSession(payload.username, payload.sessionId);
    }

    if (isGetUserSession) {
      const user: User = await this.userRepository.findByEmail(payload.sub);
      user.organizationIds = payload.organizationIds;
      user.sessionId = payload.sessionId;
      if (payload.isPatLogin) {
        (user as any).embedToken = req.cookies['tj_embed_auth_token'];
      }
      return user;
    }

    const organizationId =
      typeof req.headers['tj-workspace-id'] === 'object'
        ? req.headers['tj-workspace-id'][0]
        : req.headers['tj-workspace-id'];

    if (isUserMandatory) {
      // header does not exist
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
      user = await this.userRepository.findByEmail(
        payload.sub,
        archivedWorkspaceUser ? null : organizationId,
        WORKSPACE_USER_STATUS.ACTIVE
      );
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
