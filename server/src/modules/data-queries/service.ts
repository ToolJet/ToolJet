import { lockLibraryPins } from '@modules/query-library/locking';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, In, Not } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { Request, Response } from 'express';

type RequestWithUser = Request & { user?: { id: string } };
import { DataQueryRepository } from './repository';
import { decamelizeKeys } from 'humps';
import { serializeDataQueries } from './serialization.helper';
import {
  AddToLibraryDto,
  CreateDataQueryDto,
  IUpdatingReferencesOptions,
  ListTablesDto,
  RunLibraryQueryDto,
  UpdateDataQueryDto,
} from './dto';
import { LIBRARY_KIND } from './library/library-query.util';
import { AppAbility } from '@modules/app/decorators/ability.decorator';
import { FEATURE_KEY } from './constants';
import { isEmpty } from 'lodash';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { IDataQueriesService, QueryCreateContext, QueryUpdateContext, QueryDeleteContext } from './interfaces/IService';
import { App } from '@entities/app.entity';

import { DataQueryExecutionOptions } from './interfaces/IUtilService';
import { assertLibraryConsumerOptions } from './library/add-to-library.util';
import { QueryLibraryService } from '@modules/query-library/service';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { RequestContext } from '@modules/request-context/service';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';

import { AppValidationService } from '@modules/app-validation/service';
import { lockForValidation } from '@modules/app-validation/lock';
import { QueryWrite } from '@modules/app-validation/types';

import { LibraryLifecycleService } from '@modules/query-library/lifecycle.service';

@Injectable()
export class DataQueriesService implements IDataQueriesService {
  constructor(
    protected readonly dataQueryRepository: DataQueryRepository,
    protected readonly dataQueryUtilService: DataQueriesUtilService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly appValidationService: AppValidationService,
    protected readonly queryLibraryService: QueryLibraryService,
    protected readonly abilityService: AbilityService,
    protected readonly libraryLifecycleService: LibraryLifecycleService
  ) {}

  /**
   * Hook called before query creation - override in EE to capture state for history
   */
  protected async beforeQueryCreate(
    user: User,
    dataSource: DataSource,
    dataQueryDto: CreateDataQueryDto
  ): Promise<QueryCreateContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after query creation - override in EE to queue history
   */
  protected async afterQueryCreate(
    context: QueryCreateContext | null,
    createdQuery: any,
    user: User,
    appVersionId: string,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  /**
   * Hook called before query update - override in EE to capture state for history
   */
  protected async beforeQueryUpdate(
    user: User,
    versionId: string,
    dataQueryId: string,
    updateDataQueryDto: UpdateDataQueryDto
  ): Promise<QueryUpdateContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after query update - override in EE to queue history
   */
  protected async afterQueryUpdate(
    context: QueryUpdateContext | null,
    user: User,
    versionId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  /**
   * Hook called before query deletion - override in EE to capture state for history
   */
  protected async beforeQueryDelete(dataQueryId: string): Promise<QueryDeleteContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after query deletion - override in EE to queue history
   */
  protected async afterQueryDelete(
    context: QueryDeleteContext | null,
    dataQueryId: string,
    appVersionId: string | null,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  // Serialises name checks per app version so two concurrent creates/renames cannot
  // both pass the existence check. Lock auto-releases at txn end.
  protected async assertUniqueQueryName(
    manager: EntityManager,
    appVersionId: string,
    name: string,
    excludeQueryId?: string
  ): Promise<void> {
    if (!appVersionId || !name) return;

    await lockForValidation(manager, 'data_query_name', appVersionId);

    const where: any = { appVersionId, name };
    if (excludeQueryId) where.id = Not(excludeQueryId);

    const conflict = await manager.findOne(DataQuery, { where, select: ['id'] });
    if (conflict) {
      throw new ConflictException(`A query named "${name}" already exists in this app version`);
    }
  }

  protected async assertLibraryConsumerAccess(
    organizationId: string,
    kind?: string,
    previousKind?: string
  ): Promise<void> {
    if (kind === LIBRARY_KIND || previousKind === LIBRARY_KIND)
      await this.queryLibraryService.assertEnabled(organizationId);
  }

  async getAll(user: User, app: App, versionId: string, mode?: string) {
    const queries = await this.dataQueryRepository.getAll(versionId, mode);
    return { data_queries: serializeDataQueries(queries) };
  }

  async create(user: User, dataSource: DataSource, dataQueryDto: CreateDataQueryDto) {
    const { kind, name, options, app_version_id: appVersionId } = dataQueryDto;
    await this.assertLibraryConsumerAccess(user.organizationId, dataSource.kind);

    await this.dataQueryUtilService.validateQueryActionsAgainstEnvironment(
      user.organizationId,
      appVersionId,
      'You cannot create queries in the promoted version.'
    );

    const context = await this.beforeQueryCreate(user, dataSource, dataQueryDto);

    const result = await dbTransactionWrap(async (manager: EntityManager) => {
      await this.assertUniqueQueryName(manager, appVersionId, name);

      // After the advisory lock, so a parallel create of the same name cannot also pass.
      await this.appValidationService.check(
        'queries',
        [{ op: 'create', id: 'new', data: { name, kind, dataSourceId: dataSource.id, options } } as QueryWrite],
        { appVersionId, organizationId: user.organizationId, manager }
      );

      await lockLibraryPins(manager, user.organizationId, [{ kind: dataSource.kind, options }]);
      const dataQuery = await this.dataQueryRepository.createOne(
        {
          name,
          options,
          dataSourceId: dataSource.id,
          appVersionId,
        },
        manager
      );

      const decamelizedQuery = decamelizeKeys({ ...dataQuery, kind });

      decamelizedQuery['options'] = dataQuery.options;

      return decamelizedQuery;
    });

    const operationTimestamp = Date.now();
    this.afterQueryCreate(context, result, user, appVersionId, user?.id, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterQueryCreate failed:', err.message)
    );

    return result;
  }

  async update(user: User, versionId: string, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto) {
    const { name, options } = updateDataQueryDto;

    await this.dataQueryUtilService.validateQueryActionsAgainstEnvironment(
      user.organizationId,
      versionId,
      'You cannot update queries in the promoted version.'
    );

    const context = await this.beforeQueryUpdate(user, versionId, dataQueryId, updateDataQueryDto);

    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.query('SELECT id FROM data_queries WHERE id = $1 AND app_version_id = $2 FOR UPDATE', [
        dataQueryId,
        versionId,
      ]);
      // Scoped to the URL's version: the guards and the promoted-version check above ran
      // against it, so a query of any other version (or app) must be unreachable here.
      const existing = await manager.findOne(DataQuery, {
        where: { id: dataQueryId, appVersionId: versionId },
        select: {
          id: true,
          appVersionId: true,
          name: true,
          dataSourceId: true,
          options: true,
          dataSource: { kind: true },
        },
        relations: { dataSource: true },
      });
      if (!existing) {
        throw new NotFoundException('Data query not found');
      }
      await this.assertLibraryConsumerAccess(user.organizationId, existing.dataSource?.kind);
      if (options !== undefined) assertLibraryConsumerOptions(existing.dataSource?.kind, existing.options, options);
      if (name !== undefined && existing.name !== name) {
        await this.assertUniqueQueryName(manager, existing.appVersionId, name, dataQueryId);
      }

      const touched = Object.keys({ ...(name !== undefined && { name }), ...(options !== undefined && { options }) });
      await this.appValidationService.check(
        'queries',
        [
          {
            op: 'update',
            id: existing.id,
            data: { name: name ?? existing.name, options, dataSourceId: existing.dataSourceId },
            touched,
          } as QueryWrite,
        ],
        { appVersionId: existing.appVersionId, organizationId: user.organizationId, manager }
      );

      if (options !== undefined)
        await lockLibraryPins(manager, user.organizationId, [{ kind: existing.dataSource?.kind, options }]);
      await this.dataQueryRepository.updateOne(dataQueryId, { name, options }, manager);
    });

    const operationTimestamp = Date.now();
    this.afterQueryUpdate(context, user, versionId, updateDataQueryDto, user?.id, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterQueryUpdate failed:', err.message)
    );
  }

  // Moves an app query's logic into the workspace query library (copy + save v1) and turns the app query into a
  // consumer pinned to v1, all in one transaction. `dto.sourceOptions` must equal the stored row, so a stale client
  // can't convert something other than what the builder sees; the kept app-level keys come from the stored row.
  async addToLibrary(
    user: User,
    app: App,
    dataQueryId: string,
    versionId: string,
    dto: AddToLibraryDto
  ): Promise<{
    query: { id: string; name: string; kind: string; data_source_id: string; options: Record<string, unknown> };
    libraryQueryId: string;
    libraryVersionId: string;
  }> {
    throw new NotFoundException('Query Library is unavailable');
  }

  async delete(dataQueryId: string, versionId: string) {
    const historyUserId = (RequestContext.currentContext?.req as RequestWithUser | undefined)?.user?.id;
    const context = await this.beforeQueryDelete(dataQueryId);

    await dbTransactionWrap(async (manager: EntityManager) => {
      // Scoped to the URL's version, like update: the route's guards authorised that
      // version, so a query of any other version (or app) is a 404, not a deletion.
      const stored = await manager.findOne(DataQuery, {
        where: { id: dataQueryId, appVersionId: versionId },
        select: ['id', 'name', 'appVersionId'],
      });
      if (!stored) {
        throw new NotFoundException('Data query not found');
      }
      // Reports handlers that still run this query; deleting is still allowed.
      await this.appValidationService.check(
        'queries',
        [{ op: 'delete', id: stored.id, data: { name: stored.name } } as QueryWrite],
        { appVersionId: stored.appVersionId, manager }
      );

      await this.dataQueryRepository.deleteDataQueryEvents(dataQueryId, manager);
      await this.dataQueryRepository.deleteOne(dataQueryId);
    });

    const operationTimestamp = Date.now();
    const appVersionId = (context as any)?.appVersionId || null;
    this.afterQueryDelete(context, dataQueryId, appVersionId, historyUserId, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterQueryDelete failed:', err.message)
    );
  }

  async bulkUpdateQueryOptions(user: User, dataQueriesOptions: IUpdatingReferencesOptions[]) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.query('SELECT id FROM data_queries WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
        dataQueriesOptions.map(({ id }) => id),
      ]);
      const stored: DataQuery[] = [];
      for (const { id } of dataQueriesOptions) {
        stored.push(
          await manager.findOneOrFail(DataQuery, {
            where: { id, dataSource: { organizationId: user.organizationId } },
            relations: ['dataSource'],
          })
        );
      }

      for (const query of stored) await this.assertLibraryConsumerAccess(user.organizationId, query.dataSource?.kind);
      stored.forEach((query, i) =>
        assertLibraryConsumerOptions(query.dataSource?.kind, query.options, dataQueriesOptions[i].options)
      );
      await lockLibraryPins(
        manager,
        user.organizationId,
        stored.map((query, i) => ({ kind: query.dataSource?.kind, options: dataQueriesOptions[i].options }))
      );

      if (stored.length) {
        const writes: QueryWrite[] = dataQueriesOptions.map(({ id, options }, position) => ({
          op: 'update',
          id,
          data: {
            name: stored[position].name,
            dataSourceId: stored[position].dataSourceId,
            options: options as Record<string, any>,
          },
          touched: ['options'],
        }));
        await this.appValidationService.check('queries', writes, {
          appVersionId: stored[0].appVersionId,
          organizationId: user.organizationId,
          manager,
        });
      }

      for (const { id, options } of dataQueriesOptions) {
        await this.dataQueryRepository.updateOne(id, { options }, manager);
      }
      if (!dataQueriesOptions.length) {
        return [];
      }
      return await this.dataQueryRepository.getMany(
        { id: In(dataQueriesOptions.map((query) => query.id)) },
        [],
        manager
      );
    });
  }

  async runQueryOnBuilder(
    user: User,
    dataQueryId: string,
    environmentId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    ability: AppAbility,
    dataSource: DataSource,
    response: Response,
    mode?: string,
    app?: App
  ) {
    const { options, resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, {
      dataSource: true,
      appVersion: true,
    });

    await this.assertLibraryConsumerAccess(
      app?.organizationId ?? dataQuery.dataSource?.organizationId ?? user.organizationId,
      dataQuery.dataSource?.kind
    );

    // Persisting options on run is an EDITOR authoring convenience.
    // This endpoint is also hit by app preview, and there the user is consuming, not editing,
    // so the loaded options must NOT be written back.
    if (mode !== 'view' && ability.can(FEATURE_KEY.UPDATE_ONE, DataSource, dataSource.id) && !isEmpty(options)) {
      assertLibraryConsumerOptions(dataQuery.dataSource?.kind, dataQuery.options, options);
      await dbTransactionWrap(async (manager: EntityManager) => {
        await manager.query('SELECT id FROM data_queries WHERE id = $1 FOR UPDATE', [dataQueryId]);
        const stored = await manager.findOneOrFail(DataQuery, {
          where: { id: dataQueryId },
          relations: { dataSource: true },
        });
        await this.assertLibraryConsumerAccess(app?.organizationId ?? user.organizationId, stored.dataSource?.kind);
        assertLibraryConsumerOptions(stored.dataSource?.kind, stored.options, options);
        await lockLibraryPins(manager, user.organizationId, [{ kind: stored.dataSource?.kind, options }]);
        await this.dataQueryRepository.updateOne(dataQueryId, { options }, manager);
      });
      dataQuery['options'] = options;
    }

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, environmentId, mode, app);
  }

  async runQueryForApp(
    user: User,
    dataQueryId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    response: Response,
    app?: App
  ) {
    const { resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, {
      dataSource: true,
      appVersion: true,
    });

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, undefined, 'view', app);
  }

  // The consumer selects one explicit snapshot; the library identity only supplies workspace/name.

  // `user` is used by the EE override to apply query-level permissions on the consumer query.

  async getLibraryDefinition(consumerQueryId: string, app: App, user?: User): Promise<object> {
    throw new NotFoundException('Query Library is unavailable');
  }

  async runLibraryQuery(
    user: User,
    consumerQueryId: string,
    dto: RunLibraryQueryDto,
    response: Response,
    app: App,
    environmentId?: string
  ): Promise<object> {
    throw new NotFoundException('Query Library is unavailable');
  }

  async preview(user: User, dataQuery: DataQuery, environmentId: string, options: any, response: Response, app?: App) {
    return this.runAndGetResult(user, dataQuery, options, response, environmentId, undefined, app);
  }

  protected async runAndGetResult(
    user: User,
    dataQuery: DataQuery,
    resolvedOptions: object,
    response: Response,
    environmentId?: string,
    mode?: string,
    app?: App,
    executionOptions?: DataQueryExecutionOptions
  ): Promise<object> {
    await this.assertLibraryConsumerAccess(
      app?.organizationId ?? dataQuery.dataSource?.organizationId ?? user?.organizationId,
      dataQuery.dataSource?.kind
    );
    let result = {};

    try {
      result = await this.dataQueryUtilService.runQuery(
        user,
        dataQuery,
        resolvedOptions,
        response,
        environmentId,
        mode,
        app,
        executionOptions
      );
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error?.message,
          description: error?.description,
          data: error?.data,
          metadata: error?.metadata,
        };
      } else {
        console.error(error);
        result = {
          status: 'failed',
          message: error?.message || 'Internal server error',
          description: error?.message,
          data: error?.data || {},
        };
      }
    }

    return result;
  }

  async listTablesForApp(
    user: User,
    dataSource: DataSource,
    environmentId: string,
    branchId?: string,
    listTablesOptions?: ListTablesDto
  ) {
    let result = {};
    try {
      result = await this.dataQueryUtilService.listTables(user, dataSource, environmentId, branchId, listTablesOptions);
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error?.message,
          description: error?.description,
          data: error?.data,
        };
      } else {
        console.error(error);
        result = {
          status: 'failed',
          message: 'Internal server error',
          description: error?.message,
          data: {},
        };
      }
    }
    return result;
  }

  async changeQueryDataSource(user: User, queryId: string, dataSource: DataSource, newDataSourceId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.query('SELECT id FROM data_queries WHERE id = $1 FOR UPDATE', [queryId]);
      const newDataSource = await this.dataSourceRepository.findOneOrFail({
        where: { id: newDataSourceId, organizationId: user.organizationId },
      });
      await this.assertLibraryConsumerAccess(user.organizationId, newDataSource.kind, dataSource?.kind);
      // FIXME: Disabling this check as workflows can change data source of a query with different kind
      // if (dataSource.kind !== newDataSource.kind && dataSource) {
      //   throw new BadRequestException();
      // }

      const stored = await manager.findOne(DataQuery, {
        where: { id: queryId },
        select: ['id', 'name', 'appVersionId', 'options'],
      });
      if (stored) {
        // Kind mismatch only warns here: workflows legitimately move queries across kinds.
        await this.appValidationService.check(
          'queries',
          [
            {
              op: 'update',
              id: stored.id,
              data: { name: stored.name, kind: dataSource?.kind, dataSourceId: newDataSourceId },
              touched: ['dataSourceId'],
            } as QueryWrite,
          ],
          { appVersionId: stored.appVersionId, organizationId: user.organizationId, manager }
        );
      }

      if (stored)
        await lockLibraryPins(manager, user.organizationId, [{ kind: newDataSource.kind, options: stored.options }]);
      return this.dataQueryRepository.updateOne(queryId, { dataSourceId: newDataSource.id }, manager);

      // TODO: Audit logs
    });
  }
}
