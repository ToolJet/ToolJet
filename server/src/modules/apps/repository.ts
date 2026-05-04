import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SessionAppData } from './types';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { isUUID } from 'class-validator';

@Injectable()
export class AppsRepository extends Repository<App> {
  constructor(private dataSource: DataSource) {
    super(App, dataSource.createEntityManager());
  }

  async findBySlug(slug: string, organizationId: string, versionId?: string, branchId?: string): Promise<App> {
    if (branchId) {
      // Resolve slug through app_versions for branch context
      const version = await this.dataSource.getRepository(AppVersion).findOne({
        where: { slug, branchId },
        relations: ['app'],
      });
      if (version?.app && version.app.organizationId === organizationId) {
        return version.app;
      }
      return null;
    }

    // Released/default context: resolve through current_version_id
    const result = await this.createQueryBuilder('app')
      .innerJoin('app_versions', 'av', 'app.current_version_id = av.id')
      .where('av.slug = :slug', { slug })
      .andWhere('app.organization_id = :organizationId', { organizationId })
      .getOne();

    if (result) return result;

    // Fallback to apps table slug (for workflows or legacy)
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where: {
        ...versionCondition,
        slug,
        organizationId,
      },
    });
  }

  async retrieveAppDataUsingSlug(slug: string): Promise<SessionAppData> {
    // First try resolving through released version (app_versions.slug)
    const result = await this.createQueryBuilder('app')
      .innerJoin('app_versions', 'av', 'app.current_version_id = av.id')
      .where('av.slug = :slug', { slug })
      .select(['app.organization_id', 'av.is_public', 'app.current_version_id'])
      .getRawOne();

    if (result) {
      return {
        organizationId: result.app_organization_id,
        isPublic: result.av_is_public,
        isReleased: true,
      };
    }

    // Fallback to apps table (for workflows)
    let app: App;
    try {
      app = await this.findOneOrFail({ where: { slug } });
    } catch (error) {
      app = await this.findOne({ where: { slug } });
    }

    return {
      organizationId: app?.organizationId,
      isPublic: app?.isPublic,
      isReleased: app?.currentVersionId ? true : false,
    };
  }

  async findByAppName(name: string, organizationId: string, versionId?: string): Promise<App> {
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where: { name, organizationId, ...versionCondition },
    });
  }

  findOneById(id: string): Promise<App> {
    return this.findOne({ where: { id } });
  }

  findById(id: string, organizationId: string, versionId?: string): Promise<App> {
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    const baseWhere = { id, ...versionCondition };
    const where = organizationId ? { ...baseWhere, organizationId } : baseWhere;

    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where,
    });
  }

  findByDataQuery(dataQueryId: string, organizationId?: string, versionId?: string): Promise<App> {
    return this.findOne({
      relations: ['appVersions', 'appVersions.dataQueries'],
      where: {
        ...(organizationId ? { organizationId } : {}),
        appVersions: { dataQueries: { id: dataQueryId }, ...(versionId ? { id: versionId } : {}) },
      },
    });
  }

  async findAllOrganizationApps(organizationId: string, branchId?: string): Promise<WorkspaceAppsResponseDto[]> {
    const qb = this.createQueryBuilder('app')
      .select([
        'app.id AS id',
        'app.created_at AS "createdAt"',
        'app.organization_id AS "organizationId"',
        'version.id AS "versionId"',
        'version.name AS "versionName"',
        'version.created_at AS "versionCreatedAt"',
      ])
      .leftJoin('app_versions', 'version', 'version.app_id = app.id')
      .where('app.organizationId = :organizationId', { organizationId });

    if (branchId) {
      // Show version-level metadata for branch context
      qb.addSelect('av_meta.app_name AS name')
        .addSelect('av_meta.slug AS slug')
        .addSelect('av_meta.icon AS icon')
        .addSelect('av_meta.is_public AS "isPublic"')
        .innerJoin('app_versions', 'av_meta', 'av_meta.app_id = app.id AND av_meta.branch_id = :branchId', { branchId });
    } else {
      // No branch context: resolve metadata from released version (current_version_id),
      // falling back to the latest non-branch version (for unreleased apps), then apps table (workflows)
      qb.addSelect(
        `COALESCE(av_released.app_name, app.name) AS name`
      )
        .addSelect(`COALESCE(av_released.slug, app.slug) AS slug`)
        .addSelect(`COALESCE(av_released.icon, app.icon) AS icon`)
        .addSelect(`COALESCE(av_released.is_public, app.is_public) AS "isPublic"`)
        .leftJoin('app_versions', 'av_released', 'av_released.id = app.current_version_id');
    }

    return await qb
      .orderBy('app.created_At', 'ASC')
      .addOrderBy('version.created_at', 'ASC')
      .getRawMany();
  }

  async findByAppId(appId: string, manager?: EntityManager): Promise<App> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(App, {
        where: { id: appId },
        relations: ['appVersions'],
      });
    }, manager || this.manager);
  }

  async findByIdOrSlug(idOrSlug: string): Promise<App | null> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      if (isUUID(idOrSlug)) {
        const byId = await manager.findOne(App, { where: { id: idOrSlug }, relations: ['appVersions'] });
        if (byId) return byId;
      }
      // Try resolving through released version slug
      const result = await manager
        .createQueryBuilder(App, 'app')
        .innerJoin('app_versions', 'av', 'app.current_version_id = av.id')
        .where('av.slug = :slug', { slug: idOrSlug })
        .getOne();
      if (result) return result;

      // Fallback to apps table slug (workflows)
      return manager.findOne(App, { where: { slug: idOrSlug }, relations: ['appVersions'] });
    }, this.manager);
  }
}
