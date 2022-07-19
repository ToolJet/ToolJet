import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AppsService } from '@services/apps.service';

@Injectable()
export class IsPublicGuard implements CanActivate {
  constructor(private appsService: AppsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { params } = context.switchToHttp().getRequest();
    const app = await this.appsService.findBySlug(params['app_slug']);
    return app.isPublic;
  }
}
