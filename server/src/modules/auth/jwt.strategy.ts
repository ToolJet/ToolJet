import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../src/services/users.service';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SECRET_KEY_BASE'),
    });
  }

  async validate(payload: any) {
    if (!payload.organizationId) return false;
    const user: User = await this.usersService.findByEmail(payload.sub, payload.organizationId);
    if (!user) return false;

    user.organizationId = payload.organizationId;
    user.isPasswordLogin = payload.isPasswordLogin;

    if (user && (await this.usersService.status(user)) !== 'archived') return user;
    else return false;
  }
}
