import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { App } from 'src/entities/app.entity';
import { WorkspaceBranch } from 'src/entities/workspace_branch.entity';
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

    // Scope slug resolution to a specific branch. The same slug can appear on multiple
    // branches, so we must pin to one. Source of branch_id: x-branch-id header (sent by
    // authHeader() when the caller has an active branch). When absent, fall back to the
    // default branch (git-sync) or any version row (non-git-sync, where branch_id IS NULL).
    const branchId: string | null = (request.headers['x-branch-id'] as string) || null;

    // Resolve app through any version carrying this slug — every branch's metadata row
    // (VERSION-type on default, BRANCH-type on sub-branches) holds the slug. Select the
    // full metadata bundle so we can overlay it onto the App entity (apps.* is stale
    // for non-workflows post-migration).
    const qb = this._dataSource
      .createQueryBuilder()
      .select([
        'app.id AS app_id',
        'app.organization_id AS app_organization_id',
        'av.app_name AS av_app_name',
        'av.slug AS av_slug',
        'av.icon AS av_icon',
        'av.is_public AS av_is_public',
      ])
      .from('apps', 'app')
      .innerJoin('app_versions', 'av', 'av.app_id = app.id')
      .where('av.slug = :slug', { slug });

    if (branchId) {
      qb.andWhere('av.branch_id = :branchId', { branchId });
    } else {
      // No branch context: match either non-git-sync rows (branch_id IS NULL) or the
      // default-branch row in git-sync workspaces. Entity-class join ensures TypeORM
      // resolves the workspace_branches table from metadata, not via raw schema lookup.
      qb.leftJoin(WorkspaceBranch, 'wb', 'wb.id = av.branch_id AND wb.organization_id = app.organization_id').andWhere(
        '(av.branch_id IS NULL OR wb.is_default = true)'
      );
    }

    const result = await qb.getRawOne();

    let app;
    let isPublic: boolean;

    if (result) {
      app = await this._dataSource.manager.findOne(App, { where: { id: result.app_id } });
      isPublic = result.av_is_public;
      if (app) {
        // Overlay every metadata field (name/slug/icon/is_public) from the version row
        // since the entity is attached to request.tj_app and consumed downstream.
        if (result.av_app_name != null) app.name = result.av_app_name;
        if (result.av_slug != null) app.slug = result.av_slug;
        if (result.av_icon != null) app.icon = result.av_icon;
        app.isPublic = isPublic;
      }
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
