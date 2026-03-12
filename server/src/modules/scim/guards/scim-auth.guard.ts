import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScimAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    const scimEnabled = this.configService.get<string>('SCIM_ENABLED') === 'true';
    if (!scimEnabled) {
      throw new UnauthorizedException('SCIM not enabled');
    }

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Basic Auth check
    if (authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const [username, password] = decoded.split(':');

      const validUser = this.configService.get<string>('SCIM_BASIC_AUTH_USER');
      const validPass = this.configService.get<string>('SCIM_BASIC_AUTH_PASS');

      if (username === validUser && password === validPass) return true;
      throw new UnauthorizedException('Invalid Basic credentials');
    }

    // Bearer / Header Token check
    const token = authHeader.split(' ')[1]; //Bearer
    const validToken = this.configService.get<string>('SCIM_HEADER_AUTH_TOKEN');

    if (token === validToken || authHeader === validToken) return true;
    throw new UnauthorizedException('Invalid token');
  }
}
