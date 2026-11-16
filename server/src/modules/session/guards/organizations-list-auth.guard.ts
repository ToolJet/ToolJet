import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/* Requires a live session, but lets users list workspaces even when their current one is
   archived or they are no longer active in it, so they can switch away from it */
@Injectable()
export class OrganizationsListAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    request.isGettingOrganizations = true;
    request.isFetchingOrganization = true;

    return super.canActivate(context);
  }
}
