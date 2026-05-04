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

    // Resolve app through released version's slug (app_versions)
    const result = await this._dataSource
      .createQueryBuilder()
      .select(['app.id AS app_id', 'app.organization_id AS app_organization_id', 'av.is_public AS av_is_public'])
      .from('apps', 'app')
      .innerJoin('app_versions', 'av', 'app.current_version_id = av.id')
      .where('av.slug = :slug', { slug })
      .getRawOne();

    let app;
    let isPublic: boolean;

    if (result) {
      app = await this._dataSource.manager.findOne(App, { where: { id: result.app_id } });
      isPublic = result.av_is_public;
    } else {
      // Fallback for workflows (slug on apps table)
      app = await this._dataSource.manager.findOne(App, { where: { slug } });
      isPublic = app?.isPublic;
    }

    if (!app) throw new NotFoundException('App not found. Invalid app id');

    request.tj_app = app;
    request.tj_resource_id = app.id;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (isPublic === true) {
      return true;
    }

    return super.canActivate(context);
  }
}
