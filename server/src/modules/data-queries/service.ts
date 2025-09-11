import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { Response } from 'express';
import { DataQueryRepository } from './repository';
import { decode } from 'js-base64';
import { decamelizeKeys } from 'humps';
import { CreateDataQueryDto, IUpdatingReferencesOptions, UpdateDataQueryDto } from './dto';
import { DataQueriesUtilService } from './util.service';
import { AppAbility } from '@modules/app/decorators/ability.decorator';
import { FEATURE_KEY } from './constants';
import { isEmpty } from 'lodash';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { IDataQueriesService } from './interfaces/IService';
import { App } from '@entities/app.entity';

@Injectable()
export class DataQueriesService implements IDataQueriesService {
  constructor(
    protected readonly dataQueryRepository: DataQueryRepository,
    protected readonly dataQueryUtilService: DataQueriesUtilService,
    protected readonly dataSourceRepository: DataSourcesRepository
  ) {}

  async getAll(user: User, app: App, versionId: string, mode?: string) {
    const queries = await this.dataQueryRepository.getAll(versionId);
    const serializedQueries = [];

    // serialize
    for (const query of queries) {
      delete query['dataSource'];

      const decamelizeQuery = decamelizeKeys(query);

      decamelizeQuery['options'] = query.options;

      if (query.plugin) {
        decamelizeQuery['plugin'].manifest_file.data = JSON.parse(
          decode(query.plugin.manifestFile.data.toString('utf8'))
        );
        decamelizeQuery['plugin'].icon_file.data = query.plugin.iconFile.data.toString('utf8');
      }

      serializedQueries.push(decamelizeQuery);
    }

    const response = { data_queries: serializedQueries };

    return response;
  }

  async create(user: User, dataSource: DataSource, dataQueryDto: CreateDataQueryDto) {
    const { kind, name, options, app_version_id: appVersionId } = dataQueryDto;

    await this.dataQueryUtilService.validateQueryActionsAgainstEnvironment(
      user.defaultOrganizationId,
      appVersionId,
      'You cannot create queries in the promoted version.'
    );

    return dbTransactionWrap(async (manager: EntityManager) => {
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
  }

  async update(user: User, versionId: string, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto) {
    const { name, options } = updateDataQueryDto;

    await this.dataQueryUtilService.validateQueryActionsAgainstEnvironment(
      user.defaultOrganizationId,
      versionId,
      'You cannot update queries in the promoted version.'
    );

    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.dataQueryRepository.updateOne(dataQueryId, { name, options }, manager);
    });
  }

  async delete(dataQueryId: string) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.dataQueryRepository.deleteDataQueryEvents(dataQueryId, manager);
      await this.dataQueryRepository.deleteOne(dataQueryId);
    });
  }

  async bulkUpdateQueryOptions(user: User, dataQueriesOptions: IUpdatingReferencesOptions[]) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      for (const { id, options } of dataQueriesOptions) {
        await this.dataQueryRepository.findOneOrFail({
          where: { id, dataSource: { organizationId: user.organizationId } },
          relations: ['dataSource'],
        });
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
    mode?: string
  ) {
    const { options, resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, { dataSource: true, apps: true });

    if (ability.can(FEATURE_KEY.UPDATE_ONE, DataSource, dataSource.id) && !isEmpty(options)) {
      await this.dataQueryRepository.updateOne(dataQueryId, { options });
      dataQuery['options'] = options;
    }

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, environmentId, mode);
  }

  async runQueryForApp(user: User, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto, response: Response) {
    const { resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, { dataSource: true, apps: true });

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, undefined, 'view');
  }

  async preview(user: User, dataQuery: DataQuery, environmentId: string, options: any, response: Response) {
    return this.runAndGetResult(user, dataQuery, options, response, environmentId);
  }

  protected async runAndGetResult(
    user: User,
    dataQuery: DataQuery,
    resolvedOptions: object,
    response: Response,
    environmentId?: string,
    mode?: string
  ): Promise<object> {
    let result = {};

    try {
      result = await this.dataQueryUtilService.runQuery(
        user,
        dataQuery,
        resolvedOptions,
        response,
        environmentId,
        mode
      );
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error.message,
          description: error.description,
          data: error.data,
          metadata: error.metadata,
        };
      } else {
        console.log(error);
        result = {
          status: 'failed',
          message: 'Internal server error',
          description: error.message,
          data: {},
        };
      }
    }

    console.log('[ToolJet Backend] About to track query execution metrics');
    
    // Track query execution metrics
    this.trackQueryExecutionMetrics(user, dataQuery, result, environmentId, mode);

    console.log('[ToolJet Backend] Query execution metrics tracking completed');
    return result;
  }

  private trackQueryExecutionMetrics(
    user: User,
    dataQuery: DataQuery,
    result: any,
    environmentId?: string,
    mode?: string
  ): void {
    try {
      const { trackQueryExecution } = require('../../otel/business-metrics');
      
      console.log('[ToolJet Backend] Raw query result for metrics:', {
        resultKeys: Object.keys(result || {}),
        resultStatus: result?.status,
        resultMetadata: result?.metadata,
        dataQueryName: dataQuery?.name,
        dataQueryId: dataQuery?.id,
        dataSourceKind: dataQuery?.dataSource?.kind,
        appId: dataQuery?.app?.id,
        appName: dataQuery?.app?.name,
        dataQueryKeys: Object.keys(dataQuery || {}),
        queryOptions: dataQuery?.options
      });
      
      // Extract metadata from result
      const metadata = result.metadata || {};
      const status = result.status === 'failed' ? 'error' : 'success';
      const duration = metadata.duration || 0; // in milliseconds
      
      // Get data source type from dataQuery
      const dataSourceType = dataQuery?.dataSource?.kind || 'unknown';
      
      // Extract query text from options
      const queryText = dataQuery?.options?.query || dataQuery?.options?.sql || dataQuery?.options?.rawQuery || 'unknown';
      
      const appContext = {
        appId: dataQuery?.app?.id || 'unknown',
        appName: dataQuery?.app?.name || 'Unknown App',
        organizationId: user?.organizationId || dataQuery?.app?.organizationId || 'unknown',
        userId: user?.id || 'unknown',
        environment: environmentId || 'production'
      };
      
      console.log('[ToolJet Backend] Tracking query execution with enhanced logging:', {
        queryName: dataQuery?.name,
        status,
        duration,
        dataSourceType,
        queryText: queryText,
        appContext,
        trackQueryExecutionExists: typeof trackQueryExecution === 'function'
      });
      
      if (typeof trackQueryExecution === 'function') {
        trackQueryExecution(
          appContext,
          dataQuery?.name || 'unnamed_query',
          duration,
          status,
          dataSourceType,
          queryText
        );
        console.log('[ToolJet Backend] Query execution metrics sent successfully');
      } else {
        console.error('[ToolJet Backend] trackQueryExecution is not a function:', typeof trackQueryExecution);
      }
    } catch (error) {
      console.error('[ToolJet Backend] Failed to track query execution metrics:', error);
      console.error('[ToolJet Backend] Error stack:', error.stack);
    }
  }

  async changeQueryDataSource(user: User, queryId: string, dataSource: DataSource, newDataSourceId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const newDataSource = await this.dataSourceRepository.findOneOrFail({ where: { id: newDataSourceId } });
      // FIXME: Disabling this check as workflows can change data source of a query with different kind
      // if (dataSource.kind !== newDataSource.kind && dataSource) {
      //   throw new BadRequestException();
      // }
      return this.dataQueryRepository.updateOne(queryId, { dataSourceId: newDataSource.id }, manager);

      // TODO: Audit logs
    });
  }
}
