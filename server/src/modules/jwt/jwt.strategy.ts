import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtService } from '@services/jwt.service';
import { JWTPayload } from './types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private jwtService: JwtService) {
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
    return this.jwtService.validate(req, payload);
  }
}
