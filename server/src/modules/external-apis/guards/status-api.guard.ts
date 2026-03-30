import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StatusApiGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const externalApiAccessToken = this.configService.get<string>('EXTERNAL_API_ACCESS_TOKEN');

    if (!externalApiAccessToken) {
      throw new ForbiddenException('Status API is not configured');
    }

    if (!authHeader || authHeader !== `Basic ${externalApiAccessToken}`) {
      throw new ForbiddenException('Unauthorized');
    }

    return true;
  }
}
