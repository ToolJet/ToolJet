import { App } from '@entities/app.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SessionAppData } from './types';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataQuery } from '@entities/data_query.entity';
import { Component } from '@entities/component.entity';
import { Page } from '@entities/page.entity';
import { AppVersion } from '@entities/app_version.entity';

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

  async findPublicHostAppForModuleQuery(dataQueryId: string, organizationId: string): Promise<App | null> {
    const dataQuery = await this.dataSource.getRepository(DataQuery).findOne({
      where: { id: dataQueryId },
      relations: ['appVersion'],
    });

    if (!dataQuery?.appVersion?.appId) {
      return null;
    }

    return await this.createQueryBuilder('app')
      .innerJoin(AppVersion, 'app_version', 'app_version.app_id = app.id')
      .innerJoin(Page, 'page', 'page.app_version_id = app_version.id')
      .innerJoin(Component, 'component', 'component.page_id = page.id')
      .where('component.type = :componentType', { componentType: 'ModuleViewer' })
      .andWhere('app.organization_id = :organizationId', { organizationId })
      .andWhere('app.is_public = true')
      .andWhere('app.current_version_id = app_version.id')
      .andWhere("component.properties::jsonb -> 'moduleAppId' ->> 'value' = :moduleAppId", {
        moduleAppId: dataQuery.appVersion.appId,
      })
      .andWhere("component.properties::jsonb -> 'moduleVersionId' ->> 'value' = :moduleVersionId", {
        moduleVersionId: dataQuery.appVersionId,
      })
      .limit(1)
      .getOne();
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

  async findByAppId(appId: string, manager?: EntityManager): Promise<App> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(App, {
        where: { id: appId },
        relations: ['appVersions'],
      });
    }, manager || this.manager);
  }
}
