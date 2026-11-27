import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { equalSecret } from '@modules/mcp-oauth/protocol';

// Values an earlier .env.example shipped. Copies of that file must not authenticate.
const SAMPLE_BASIC_USER = '12345';
const SAMPLE_BASIC_PASS = '12345';
const SAMPLE_HEADER_TOKEN = 'my-secure-header-token';

const isSet = (value: string | undefined): value is string => !!value;

@Injectable()
export class ScimAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    const scimEnabled = this.configService.get<string>('SCIM_ENABLED') === 'true';
    if (!scimEnabled) {
      throw new UnauthorizedException('SCIM not enabled');
    }

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Each scheme is accepted only when its own credentials are configured.
    if (authHeader.startsWith('Basic ')) {
      const validUser = this.configService.get<string>('SCIM_BASIC_AUTH_USER');
      const validPass = this.configService.get<string>('SCIM_BASIC_AUTH_PASS');
      const isSample = validUser === SAMPLE_BASIC_USER && validPass === SAMPLE_BASIC_PASS;
      if (!isSet(validUser) || !isSet(validPass) || isSample) {
        throw new UnauthorizedException('Invalid Basic credentials');
      }

      const decoded = Buffer.from(authHeader.slice('Basic '.length), 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      const username = separator === -1 ? decoded : decoded.slice(0, separator);
      const password = separator === -1 ? '' : decoded.slice(separator + 1);

      if (equalSecret(username, validUser) && equalSecret(password, validPass)) return true;
      throw new UnauthorizedException('Invalid Basic credentials');
    }

    const validToken = this.configService.get<string>('SCIM_HEADER_AUTH_TOKEN');
    if (!isSet(validToken) || validToken === SAMPLE_HEADER_TOKEN) {
      throw new UnauthorizedException('Invalid token');
    }

    // Identity providers send the token after a scheme ("Bearer <token>", any case) or as the bare header value.
    if (equalSecret(authHeader.split(' ')[1], validToken) || equalSecret(authHeader, validToken)) return true;
    throw new UnauthorizedException('Invalid token');
  }
}
