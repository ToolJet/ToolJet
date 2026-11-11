import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// The External API is Enterprise-only; Community builds reject every request.
@Injectable()
export class ExternalApiAuthGuard implements CanActivate {
  async canActivate(_context: ExecutionContext): Promise<boolean> {
    return false;
  }
}
