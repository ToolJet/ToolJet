import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OrganizationLicenseAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request?.params?.organizationId;

    if (user.organizationId != organizationId) {
      throw new ForbiddenException("Access to the requested organization's data is forbidden");
    }
    return true;
  }
}
