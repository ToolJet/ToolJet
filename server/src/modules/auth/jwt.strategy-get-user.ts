import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../src/services/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategyGetUser extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SECRET_KEY_BASE'),
    });
  }

  async validate(payload: any) {
    if (!payload.organisationId) return {};

    const user = await this.usersService.findByEmail(payload.sub, payload.organisationId);
    if (!user) return {};

    user.organizationId = payload.organisationId;
    return user;
  }
}
