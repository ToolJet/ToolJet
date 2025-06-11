import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExternalApiSecurityGuard implements CanActivate {
  constructor(protected configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if external API is enabled
    const isExternalApiEnabled = this.configService.get<string>('ENABLE_EXTERNAL_API') === 'true';
    if (!isExternalApiEnabled) {
      throw new ForbiddenException('External API is disabled');
    }

    // // Check the authorization header
    const authHeader = request.headers['authorization'];
    const externalApiAccessToken = this.configService.get<string>('EXTERNAL_API_ACCESS_TOKEN');

    if (!authHeader || authHeader !== `Basic ${externalApiAccessToken}`) {
      throw new ForbiddenException('Unauthorized');
    }

    return true;
  }
}
