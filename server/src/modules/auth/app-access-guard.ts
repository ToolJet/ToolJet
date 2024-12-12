import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AppsService } from '@services/apps.service';
import { OrganizationUsersService } from '@services/organization_users.service';

@Injectable()
export class AppAccessGuard implements CanActivate {
  constructor(private appsService: AppsService, private organizationUserService: OrganizationUsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const appSlug = request.params.slug;
    const app = await this.appsService.findAppWithIdOrSlug(appSlug);
    request.tj_app = app;
    const isMemberActive = await this.organizationUserService.isTheUserIsAnActiveMemberOfTheWorkspace(
      user.id,
      app.organizationId
    );

    if (!isMemberActive) {
      throw new UnauthorizedException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }
    return true;
  }
}
