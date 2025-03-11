import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { App } from 'src/entities/app.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class PublicAppEnvironmentGuard extends AuthGuard('jwt') {
  constructor(protected readonly _dataSource: DataSource) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    const slug = request.query.slug;
    if (!slug) {
      throw new NotFoundException('App not found. Invalid app id');
    }

    // unauthenticated users should be able to to view public apps
    const app = await this._dataSource.manager.findOne(App, {
      where: {
        slug,
      },
    });
    if (!app) throw new NotFoundException('App not found. Invalid app id');

    request.tj_app = app;
    request.tj_resource_id = app.id;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (app.isPublic === true) {
      return true;
    }

    return super.canActivate(context);
  }
}
