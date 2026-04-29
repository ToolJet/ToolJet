import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

const BASIC_AUTH_PATTERN = /^basic\s+(\S+)$/i;
const BEARER_AUTH_PATTERN = /^bearer\s+(\S+)$/i;

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasReservedSchemeOnly(header: string): boolean {
  const normalizedHeader = header.trim().toLowerCase();
  return normalizedHeader === 'basic' || normalizedHeader === 'bearer';
}

function safeSecretMatch(value: unknown, expected: unknown): boolean {
  if (!isNonBlankString(value) || !isNonBlankString(expected)) {
    return false;
  }

  const valueDigest = createHash('sha256').update(value, 'utf8').digest();
  const expectedDigest = createHash('sha256').update(expected, 'utf8').digest();

  return timingSafeEqual(valueDigest, expectedDigest);
}

function decodeBasicCredentials(base64Credentials: string): { username: string; password: string } | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64Credentials)) {
    return null;
  }

  const paddedCredentials = base64Credentials.padEnd(
    base64Credentials.length + ((4 - (base64Credentials.length % 4)) % 4),
    '='
  );
  const decodedCredentials = Buffer.from(paddedCredentials, 'base64').toString('utf8');
  const separatorIndex = decodedCredentials.indexOf(':');

  if (separatorIndex <= 0 || separatorIndex === decodedCredentials.length - 1) {
    return null;
  }

  return {
    username: decodedCredentials.slice(0, separatorIndex),
    password: decodedCredentials.slice(separatorIndex + 1),
  };
}

@Injectable()
export class ScimAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    const scimEnabled = this.configService.get<string>('SCIM_ENABLED') === 'true';
    if (!scimEnabled) {
      throw new UnauthorizedException('SCIM not enabled');
    }

    if (authHeader === undefined || authHeader === null) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    if (!isNonBlankString(authHeader)) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    const normalizedHeader = authHeader.trim();

    if (hasReservedSchemeOnly(normalizedHeader)) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    const basicMatch = normalizedHeader.match(BASIC_AUTH_PATTERN);
    if (basicMatch) {
      return this.validateBasicCredentials(basicMatch[1]);
    }

    const bearerMatch = normalizedHeader.match(BEARER_AUTH_PATTERN);
    if (bearerMatch) {
      return this.validateHeaderToken(bearerMatch[1]);
    }

    if (this.isValidHeaderToken(authHeader)) {
      return true;
    }

    throw new UnauthorizedException('Invalid token');
  }

  private validateBasicCredentials(base64Credentials: string): boolean {
    const parsedCredentials = decodeBasicCredentials(base64Credentials);

    if (!parsedCredentials) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    const validUser = this.configService.get<string>('SCIM_BASIC_AUTH_USER');
    const validPass = this.configService.get<string>('SCIM_BASIC_AUTH_PASS');

    if (
      safeSecretMatch(parsedCredentials.username, validUser) &&
      safeSecretMatch(parsedCredentials.password, validPass)
    ) {
      return true;
    }

    throw new UnauthorizedException('Invalid Basic credentials');
  }

  private validateHeaderToken(token: string): boolean {
    if (this.isValidHeaderToken(token)) {
      return true;
    }

    throw new UnauthorizedException('Invalid token');
  }

  private isValidHeaderToken(token: string): boolean {
    const validToken = this.configService.get<string>('SCIM_HEADER_AUTH_TOKEN');
    return safeSecretMatch(token, validToken);
  }
}
