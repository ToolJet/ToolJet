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
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(DataQuery, {
        relations: {
          dataSource: true,
        },
        where: {
          appVersionId: versionId,
          dataSource: {
            ...(scope ? { scope } : {}),
          },
        },
      });
    }, manager || this.manager);
  }

  getOneById(dataQueryId: string, relations?: FindOptionsRelations<DataQuery>): Promise<DataQuery> {
    return this.manager.findOne(DataQuery, {
      where: { id: dataQueryId },
      relations: relations || {},
    });
  }

  async findPublicParentAppForModuleQuery(moduleAppId: string, dataQueryId: string): Promise<App | null> {
    const qb = this.manager
      .createQueryBuilder(App, 'app')
      .innerJoin(AppVersion, 'app_version', 'app_version.app_id = app.id')
      .innerJoin(Page, 'page', 'page.app_version_id = app_version.id')
      .innerJoin(Component, 'component', 'component.page_id = page.id')
      .innerJoin(DataQuery, 'data_query', 'data_query.id = :dataQueryId', { dataQueryId })
      .innerJoin(AppVersion, 'module_version', 'module_version.id = data_query.app_version_id')
      .innerJoin(App, 'module_app', 'module_app.id = module_version.app_id')
      .where('component.type = :componentType', { componentType: 'ModuleViewer' })
      .andWhere('app_version.is_public = true')
      .andWhere(
        `(app.current_version_id = app_version.id
          OR NOT EXISTS (
            SELECT 1 FROM workspace_branches wb WHERE wb.organization_id = app.organization_id
          ))`
      )
      .andWhere('module_version.app_id = :moduleAppId', { moduleAppId })
      .andWhere('module_version.app_id != app.id')
      .andWhere('app.organization_id = module_app.organization_id')
      .andWhere("component.properties::jsonb -> 'moduleAppId' ->> 'value' = module_app.co_relation_id::text")
      .andWhere(
        `(component.properties::jsonb -> 'moduleVersionId' ->> 'value' = ''
          OR component.properties::jsonb -> 'moduleVersionId' ->> 'value' = module_version.module_reference_id::text
          OR component.properties::jsonb -> 'moduleVersionId' ->> 'value' = data_query.app_version_id::text)`
      )
      .limit(1);

    return qb.getOne();
  }

  getAll(appVersionId: string): Promise<DataQuery[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager
        .createQueryBuilder(DataQuery, 'data_query')
        .innerJoinAndSelect('data_query.dataSource', 'data_source')
        .leftJoinAndSelect('data_query.plugins', 'plugins')
        .leftJoinAndSelect('plugins.iconFile', 'iconFile')
        .leftJoinAndSelect('plugins.manifestFile', 'manifestFile')
        .where('data_source.appVersionId = :appVersionId', { appVersionId })
        .where('data_query.app_version_id = :appVersionId', { appVersionId })
        .orderBy('data_query.updatedAt', 'DESC')
        .getMany();
    });
  }

  getAllWithPermissions(appVersionId: string): Promise<DataQuery[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager
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
    });
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
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.find(DataQuery, {
        where: { ...(findOptions ? findOptions : {}) },
        relations: relations || [],
      });
    }, manager || this.manager);
  }
}
