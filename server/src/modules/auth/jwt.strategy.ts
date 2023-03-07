import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../src/services/users.service';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { USER_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService, private configService: ConfigService) {
    super({
      jwtFromRequest: (request) => {
        return request?.cookies['auth_token'];
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SECRET_KEY_BASE'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JWTPayload) {
    const isUserMandatory = !req['isUserNotMandatory'];
    const isGetUserSession = !!req['isGetUserSession'];

    if (isGetUserSession) {
      const user: User = await this.usersService.findByEmail(payload.sub);
      if (!user) {
        return false;
      }
      user.organizationIds = payload.organizationIds;
      return user;
    }

    const organizationId =
      typeof req.headers['tj-workspace-id'] === 'object'
        ? req.headers['tj-workspace-id'][0]
        : req.headers['tj-workspace-id'];

    if (isUserMandatory) {
      // header des not exist
      if (!organizationId) return false;

      // No authenticated workspaces
      if (!payload.organizationIds?.length) {
        return false;
      }
      // requested workspace not authenticated
      if (!payload.organizationIds.some((oid) => oid === organizationId)) {
        return false;
      }
    }

    if (payload?.sub && organizationId) {
      const user: User = await this.usersService.findByEmail(payload.sub, organizationId, WORKSPACE_USER_STATUS.ACTIVE);
      if (!user || user.status !== USER_STATUS.ACTIVE) return false;

      user.organizationId = organizationId;
      user.organizationIds = payload.organizationIds;
      user.isPasswordLogin = payload.isPasswordLogin;
      user.isSSOLogin = payload.isSSOLogin;

      return user;
    }
    return {};
  }
}

type JWTPayload = {
  sub: string;
  organizationId?: string;
  organizationIds?: Array<string>;
  isPasswordLogin: boolean;
  isSSOLogin: boolean;
};
