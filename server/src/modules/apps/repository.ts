import { App } from '@entities/app.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SessionAppData } from './types';

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
}
