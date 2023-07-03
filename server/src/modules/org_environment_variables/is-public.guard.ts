import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AppsService } from '@services/apps.service';

@Injectable()
export class IsPublicGuard implements CanActivate {
  constructor(private appsService: AppsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request?.params?.app_slug) {
      return false;
    }
    const app = await this.appsService.findBySlug(request.params.app_slug);
    request.tj_app = app;
    return !!app?.isPublic;
  }
}
