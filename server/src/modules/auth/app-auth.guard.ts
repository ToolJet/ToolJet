import { ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppsService } from 'src/services/apps.service';

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor(private appsService: AppsService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    if (!request.params.slug) {
      throw new NotFoundException('App not found. Invalid app id');
    }
    // unauthenticated users should be able to to view public apps
    const app = await this.appsService.findBySlug(request.params.slug);
    if (!app) throw new NotFoundException('App not found. Invalid app id');

    request.tj_app = app;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (app.isPublic === true) {
      return true;
    }

    // Throw a custom exception with workspace ID if the app is not public
    try {
      const authResult = await super.canActivate(context);
      return authResult;
    } catch (error) {
      throw new UnauthorizedException(
        JSON.stringify({
          organizationId: app?.organizationId,
          message: 'Authentication is required to access this app.',
        })
      );
    }
  }
}
