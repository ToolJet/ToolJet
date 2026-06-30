import { DataQuery } from '@entities/data_query.entity';
import { EventHandler } from '@entities/event_handler.entity';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { Component } from '@entities/component.entity';
import { Page } from '@entities/page.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { cleanObject } from '@helpers/utils.helper';
import { DataSourceScopes } from '@modules/data-sources/constants';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class DataQueryRepository extends Repository<DataQuery> {
  constructor(private dataSource: DataSource) {
    super(DataQuery, dataSource.createEntityManager());
  }

  getQueriesByVersionId(versionId: string, scope: DataSourceScopes, manager?: EntityManager): Promise<DataQuery[]> {
    const m = manager ?? this.manager;
    return m.find(DataQuery, {
      relations: { dataSource: true },
      where: {
        appVersionId: versionId,
        dataSource: { ...(scope ? { scope } : {}) },
      },
    });
  }

  getOneById(dataQueryId: string, relations?: FindOptionsRelations<DataQuery>): Promise<DataQuery> {
    return this.manager.findOne(DataQuery, {
      where: { id: dataQueryId },
      relations: relations || {},
    });
  }

  async findPublicParentAppForModuleQuery(moduleAppId: string, dataQueryId: string): Promise<App | null> {
    return this.manager
      .createQueryBuilder(App, 'app')
      // Structural join: traverse the deployed version's pages and components.
      .innerJoin(AppVersion, 'app_version', 'app_version.app_id = app.id AND app_version.id = app.current_version_id')
      .innerJoin(Page, 'page', 'page.app_version_id = app_version.id')
      .innerJoin(Component, 'component', 'component.page_id = page.id')
      .innerJoin(DataQuery, 'data_query', 'data_query.id = :dataQueryId', { dataQueryId })
      .innerJoin(AppVersion, 'module_version', 'module_version.id = data_query.app_version_id')
      .innerJoin(App, 'module_app', 'module_app.id = module_version.app_id')
      // Metadata join: resolve is_public independently of which version is deployed.
      // For git-sync apps apps.is_public is null; the canonical flag lives on the most
      // recently updated version on the default branch (mirrors resolveMetadataVersion).
      // For non-git-sync apps wb and av_meta will both be null, falling through to app.is_public.
      .leftJoin(
        'organization_git_sync_branches',
        'wb',
        'wb.organization_id = app.organization_id AND wb.is_default = true'
      )
      .leftJoin(
        AppVersion,
        'av_meta',
        `av_meta.app_id = app.id
         AND av_meta.branch_id = wb.id
         AND av_meta.id = (
           SELECT av2.id FROM app_versions av2
           WHERE av2.app_id = app.id AND av2.branch_id = wb.id
           ORDER BY av2.updated_at DESC LIMIT 1
         )`
      )
      .where('component.type = :componentType', { componentType: 'ModuleViewer' })
      // Priority: git-sync metadata version → app row → structural version (non-git-sync fallback).
      .andWhere('COALESCE(av_meta.is_public, app.is_public, app_version.is_public) = true')
      .andWhere('module_version.app_id = :moduleAppId', { moduleAppId })
      .andWhere('module_version.app_id != app.id')
      .andWhere('app.organization_id = module_app.organization_id')
      .andWhere("component.properties::jsonb -> 'moduleAppId' ->> 'value' = module_app.co_relation_id::text")
      .andWhere(
        `(component.properties::jsonb -> 'moduleVersionId' ->> 'value' = ''
          OR component.properties::jsonb -> 'moduleVersionId' ->> 'value' = module_version.module_reference_id::text
          OR component.properties::jsonb -> 'moduleVersionId' ->> 'value' = data_query.app_version_id::text)`
      )
      .limit(1)
      .getOne();
  }

  getAll(appVersionId: string): Promise<DataQuery[]> {
    return this.manager
      .createQueryBuilder(DataQuery, 'data_query')
      .innerJoinAndSelect('data_query.dataSource', 'data_source')
      .leftJoinAndSelect('data_query.plugins', 'plugins')
      .leftJoinAndSelect('plugins.iconFile', 'iconFile')
      .leftJoinAndSelect('plugins.manifestFile', 'manifestFile')
      .where('data_source.appVersionId = :appVersionId', { appVersionId })
      .where('data_query.app_version_id = :appVersionId', { appVersionId })
      .orderBy('data_query.updatedAt', 'DESC')
      .getMany();
  }

  getAllWithPermissions(appVersionId: string): Promise<DataQuery[]> {
    return this.manager
      .createQueryBuilder(DataQuery, 'data_query')
      .innerJoinAndSelect('data_query.dataSource', 'data_source')
      .leftJoinAndSelect('data_query.plugins', 'plugins')
      .leftJoinAndSelect('plugins.iconFile', 'iconFile')
      .leftJoinAndSelect('plugins.manifestFile', 'manifestFile')
      .leftJoinAndSelect('data_query.permissions', 'permission')
      .leftJoinAndSelect('permission.users', 'queryUser')
      .leftJoinAndSelect('queryUser.user', 'user')
      .leftJoinAndSelect('queryUser.permissionGroup', 'group')
      .where('data_source.appVersionId = :appVersionId', { appVersionId })
      .where('data_query.app_version_id = :appVersionId', { appVersionId })
      .orderBy('data_query.updatedAt', 'DESC')
      .getMany();
  }

  async createOne(data: Partial<DataQuery>, manager?: EntityManager): Promise<DataQuery> {
    return dbTransactionWrap((manager: EntityManager) => {
      const newDataQuery = manager.create(DataQuery, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return manager.save(newDataQuery);
    }, manager || this.manager);
  }
  async deleteDataQueryEvents(dataQueryId: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const allEvents = await manager.find(EventHandler, {
        where: { sourceId: dataQueryId },
      });

      return await manager.remove(allEvents);
    }, manager || this.manager);
  }

  async deleteOne(dataQueryId: string, manager?: EntityManager) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(DataQuery, { id: dataQueryId });
    }, manager || this.manager);
  }

  async updateOne(dataQueryId: string, options: Partial<DataQuery>, manager?: EntityManager): Promise<DataQuery> {
    return dbTransactionWrap((manager: EntityManager) => {
      const updatableParams = cleanObject(options);
      return manager.update(
        DataQuery,
        { id: dataQueryId },
        {
          updatedAt: new Date(),
          ...updatableParams,
        }
      );
    }, manager || this.manager);
  }

  async getMany(
    findOptions: FindOptionsWhere<DataQuery>,
    relations?: string[],
    manager?: EntityManager
  ): Promise<DataQuery[]> {
    const m = manager ?? this.manager;
    return m.find(DataQuery, {
      where: { ...(findOptions ? findOptions : {}) },
      relations: relations || [],
    });
  }
}
