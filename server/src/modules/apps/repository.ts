import { App } from '@entities/app.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SessionAppData } from './types';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';

@Injectable()
export class AppsRepository extends Repository<App> {
  constructor(private dataSource: DataSource) {
    super(App, dataSource.createEntityManager());
  }

  findBySlug(slug: string, organizationId: string, versionId?: string): Promise<App> {
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
    let app: App;
    try {
      app = await this.findOneOrFail({ where: { slug } });
    } catch (error) {
      app = await this.findOne({
        where: { slug },
      });
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

  findById(id: string, organizationId: string, versionId?: string): Promise<App> {
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where: { id, organizationId, ...versionCondition },
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

  async findAllOrganizationApps(organizationId: string): Promise<WorkspaceAppsResponseDto[]> {
    return await this.createQueryBuilder('app')
      .select([
        'app.id AS id',
        'app.name AS name',
        'app.slug AS slug',
        'app.created_at AS createdAt',
        'app.organization_id AS organizationId',
        'version.id AS versionId',
        'version.name AS versionName',
        'version.created_at AS versionCreatedAt',
      ])
      .leftJoin('app_versions', 'version', 'version.app_id = app.id')
      .where('app.organizationId = :organizationId', { organizationId })
      .orderBy('app.created_At', 'ASC')
      .orderBy('version.created_at', 'ASC')
      .getRawMany();
  }
}
