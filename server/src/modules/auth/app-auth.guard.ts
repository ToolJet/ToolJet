import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { App } from 'src/entities/app.entity';
import { getManager } from 'typeorm';

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    const slug = request.params.slug;
    if (!slug) {
      throw new NotFoundException('App not found. Invalid app id');
    }

    // unauthenticated users should be able to to view public apps
    const app = await getManager().findOne(App, {
      where: {
        slug,
      },
    });
    if (!app) throw new NotFoundException('App not found. Invalid app id');

    request.tj_app = app;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (app.isPublic === true) {
      return true;
    }

    return super.canActivate(context);
  }
}
