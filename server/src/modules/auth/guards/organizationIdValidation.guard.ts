import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class OrganizationIdValidationGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    const paramOrgId = request?.params['organizationId'];

    if (!user || !user.organizationId) {
      throw new HttpException('User is not authenticated or missing organization information', HttpStatus.UNAUTHORIZED);
    }

    // Validate that the organizationId from the request matches the user's session organizationId
    if (paramOrgId && user.organizationId !== paramOrgId) {
      throw new HttpException('Invalid organization ID', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
