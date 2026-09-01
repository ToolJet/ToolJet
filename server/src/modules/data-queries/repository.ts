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
    return (
      this.manager
        .createQueryBuilder(App, 'app')
        // Structural join: traverse the deployed version's pages and components.
        .innerJoin(AppVersion, 'app_version', 'app_version.app_id = app.id AND app_version.id = app.current_version_id')
        .innerJoin(Page, 'page', 'page.app_version_id = app_version.id')
        .innerJoin(Component, 'component', 'component.page_id = page.id')
        .innerJoin(DataQuery, 'data_query', 'data_query.id = :dataQueryId', { dataQueryId })
        .innerJoin(AppVersion, 'module_version', 'module_version.id = data_query.app_version_id')
        .innerJoin(App, 'module_app', 'module_app.id = module_version.app_id')
        // Metadata join: same row selection as AppsRepository.resolveMetadataVersion —
        // without the is_stub filter/is_synced ordering, a stub row can outrank the
        // canonical one on updated_at and read is_public as null, 401-ing a genuinely public app.
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
         AND av_meta.is_stub = false
         AND av_meta.id = (
           SELECT av2.id FROM app_versions av2
           WHERE av2.app_id = app.id AND av2.branch_id = wb.id AND av2.is_stub = false
           ORDER BY av2.is_synced DESC, av2.updated_at DESC LIMIT 1
         )`
        )
        .where('component.type = :componentType', { componentType: 'ModuleViewer' })
        // apps.is_public is never written (AppsUtilService.update), so app_version.is_public
        // is the only real fallback if av_meta doesn't match.
        .andWhere('COALESCE(av_meta.is_public, app_version.is_public) = true')
        .andWhere('module_version.app_id = :moduleAppId', { moduleAppId })
        .andWhere('module_version.app_id != app.id')
        .andWhere('app.organization_id = module_app.organization_id')
        .andWhere("component.properties::jsonb -> 'moduleAppId' ->> 'value' = module_app.co_relation_id::text")
        .andWhere(
          `COALESCE(
             NULLIF(component.properties::jsonb -> 'moduleVersionId' ->> 'versionName', ''),
             COALESCE(component.properties::jsonb -> 'moduleVersionId' ->> 'value', '')
           ) IN (
             '', '__default_branch_draft__',
             module_version.module_reference_id::text,
             module_version.name,
             data_query.app_version_id::text
           )`
        )
        .limit(1)
        .getOne()
    );
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
