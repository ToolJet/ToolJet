import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { Request } from 'express';
import { UserRepository } from '@modules/users/repositories/repository';
import { SessionUtilService } from '../util.service';
import { JWTPayload } from '../types';
import { UserSessionRepository } from '@modules/session/repository';
import { TransactionLogger } from '@modules/logging/service';
import { trackUserActivity } from '@otel/tracing';
import * as crypto from 'crypto';
import * as uuid from 'uuid';

const ADMIN_API_KEY_HEADER = 'tj-admin-api-key';
const WORKSPACE_ID_HEADER = 'tj-workspace-id';

/* Headers may arrive as string | string[]; normalise to a single value */
function getHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/* Constant-time comparison to avoid leaking the key via timing */
function safeCompare(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly userRepository: UserRepository,
    protected readonly sessionRepository: UserSessionRepository,
    protected readonly transactionLogger: TransactionLogger
  ) {
    super({
      jwtFromRequest: (request: Request) => {
        /*
         * Admin API key authentication: when a valid `tj-admin-api-key` header is supplied,
         * mint a short-lived synthetic token (signed with SECRET_KEY_BASE) so the request can
         * flow through the JWT strategy. The actual workspace/user resolution and the session
         * skip happen in validate(). The synthetic token only carries `isAdminApiKeyAuth: true`,
         * and because it is signed with our own secret it cannot be forged by a caller.
         */
        const adminApiKey = getHeader(request, ADMIN_API_KEY_HEADER);
        if (adminApiKey) {
          const expectedKey = configService.get<string>('TJ_ADMIN_API_KEY');
          if (safeCompare(adminApiKey, expectedKey)) {
            return sessionUtilService.sign({ isAdminApiKeyAuth: true });
          }
        }
        // Ensure PAT is processed correctly without bypassing JWT validation
        if (request.headers['tj_auth_token']) {
          return request.headers['tj_auth_token'];
        }
        return request.cookies['tj_auth_token'];
      },
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('SECRET_KEY_BASE'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JWTPayload) {
    const startTime = Date.now();
    this.transactionLogger.log(`JwtStrategy validate invoked at ${new Date().toISOString()}`);
    try {
      /* Admin API key flow: skip the session check and impersonate the workspace admin */
      if (payload?.isAdminApiKeyAuth) {
        return await this.validateAdminApiKeySession(req);
      }

      const isUserMandatory = !req['isUserNotMandatory'];
      const isGetUserSession = !!req['isGetUserSession'];
      const isGettingOrganizations = !!req['isGettingOrganizations'];
      const bypassOrganizationValidation = !req['isFetchingOrganization'] && !req['isSwitchingOrganization'];
      /* User is going through invite flow */
      const isInviteSession = !!req['isInviteSession'];

      let organizationId =
        typeof req.headers['tj-workspace-id'] === 'object'
          ? req.headers['tj-workspace-id'][0]
          : req.headers['tj-workspace-id'];

      if (!organizationId && payload?.isPATLogin && payload?.appId) {
        organizationId = payload.organizationIds[0];
      }

      if (isUserMandatory || isGetUserSession || isInviteSession) {
        await this.sessionUtilService.validateUserSession(payload.username, payload.sessionId, organizationId);
      }

      if (isGetUserSession) {
        const user: User = await this.userRepository.findByEmail(payload.sub);
        user.organizationIds = payload.organizationIds;
        user.sessionId = payload.sessionId;
        user.tjApiSource = payload.tj_api_source;

        return user;
      }

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
        user.tjApiSource = payload.tj_api_source;
        if (isInviteSession) user.invitedOrganizationId = payload.invitedOrganizationId;

        // Track user activity for metrics (every authenticated request)
        if (user.organizationId && user.id) {
          try {
            trackUserActivity({
              workspaceId: user.organizationId,
              userId: user.id,
              sessionId: payload.sessionId,
            });
          } catch (error) {
            // Don't let metrics tracking failures affect authentication
            console.error('Error tracking user activity:', error);
          }
        }
      }

      return user;
    } finally {
      this.transactionLogger.log(
        `JwtStrategy validate completed at ${new Date().toISOString()} after ${Date.now() - startTime}ms`
      );
    }
  }

  /**
   * Resolves an authenticated user from the `tj-admin-api-key` header without a real session.
   *
   * Re-verifies the key against TJ_ADMIN_API_KEY (defence in depth), reads the target workspace
   * from the `tj-workspace-id` header, loads that workspace's admin user and returns a simulated
   * session for them. The regular `validateUserSession` check is intentionally skipped here.
   */
  private async validateAdminApiKeySession(req: Request): Promise<User | false> {
    const adminApiKey = getHeader(req, ADMIN_API_KEY_HEADER);
    const expectedKey = this.configService.get<string>('TJ_ADMIN_API_KEY');
    if (!safeCompare(adminApiKey, expectedKey)) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    const organizationId = getHeader(req, WORKSPACE_ID_HEADER);
    if (!organizationId) {
      throw new BadRequestException(`${WORKSPACE_ID_HEADER} header is required for admin API key authentication`);
    }

    /* Validates the workspace exists and is active */
    await this.sessionUtilService.findOrganization(organizationId);

    const adminUser = await this.userRepository.getUserWithAdminRole(organizationId);
    if (!adminUser) {
      throw new UnauthorizedException('No admin user found for the requested workspace');
    }

    /* Re-fetch with the workspace context so organizationUsers relations are populated,
       matching the shape produced by the regular JWT flow. */
    const user = await this.userRepository.findByEmail(
      adminUser.email,
      organizationId,
      WORKSPACE_USER_STATUS.ACTIVE
    );
    if (!user) {
      throw new UnauthorizedException('No admin user found for the requested workspace');
    }

    /* Simulate a user session — no UserSessions row is created or validated */
    user.organizationId = organizationId;
    user.organizationIds = [organizationId];
    user.sessionId = uuid.v4();
    user.isPasswordLogin = false;
    user.isSSOLogin = false;

    if (user.organizationId && user.id) {
      try {
        trackUserActivity({
          workspaceId: user.organizationId,
          userId: user.id,
          sessionId: user.sessionId,
        });
      } catch (error) {
        console.error('Error tracking user activity:', error);
      }
    }

    return user;
  }
}
