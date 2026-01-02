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
import { AppHistoryUtilService } from '@modules/app-history/util.service';
import { ACTION_TYPE } from '@modules/app-history/constants';

@Injectable()
export class DataQueriesService implements IDataQueriesService {
  constructor(
    protected readonly dataQueryRepository: DataQueryRepository,
    protected readonly dataQueryUtilService: DataQueriesUtilService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly appHistoryUtilService: AppHistoryUtilService
  ) { }

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

    const result = await dbTransactionWrap(async (manager: EntityManager) => {
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

    // Queue history capture after successful data query creation
    try {
      await this.appHistoryUtilService.queueHistoryCapture(dataQueryDto.app_version_id, ACTION_TYPE.QUERY_ADD, {
        queryName: dataQueryDto.name || 'Unnamed Query',
        queryId: result.id,
        operation: 'create',
        queryData: dataQueryDto,
        userId: user?.id,
      });
    } catch (error) {
      console.error('Failed to queue history capture for data query creation:', error);
    }

    return result;
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

    // Queue history capture after successful data query update
    try {
      await this.appHistoryUtilService.queueHistoryCapture(versionId, ACTION_TYPE.QUERY_UPDATE, {
        queryName: updateDataQueryDto.name || 'Unnamed Query',
        queryId: dataQueryId,
        operation: 'update',
        queryData: updateDataQueryDto,
        userId: user?.id,
      });
    } catch (error) {
      console.error('Failed to queue history capture for data query update:', error);
    }
  }

  async delete(dataQueryId: string) {
    // Get app version ID before deletion (minimal query)
    let appVersionId: string | null = null;

    try {
      const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, { apps: true });
      if (dataQuery?.appVersionId) {
        appVersionId = dataQuery.appVersionId;
      }
    } catch (error) {
      console.error('Failed to get app version ID for history capture:', error);
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.dataQueryRepository.deleteDataQueryEvents(dataQueryId, manager);
      await this.dataQueryRepository.deleteOne(dataQueryId);
    });

    // Queue history capture with minimal data - queue will resolve name from previous state
    if (appVersionId) {
      try {
        await this.appHistoryUtilService.queueHistoryCapture(appVersionId, ACTION_TYPE.QUERY_DELETE, {
          queryId: dataQueryId,
          operation: 'delete',
          // No need to pre-fetch queryName - queue processor will resolve from history
        });
      } catch (error) {
        console.error('Failed to queue history capture for data query deletion:', error);
      }
    }
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
    mode?: string,
    app?: App
  ) {
    const { options, resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, { dataSource: true });

    if (ability.can(FEATURE_KEY.UPDATE_ONE, DataSource, dataSource.id) && !isEmpty(options)) {
      await this.dataQueryRepository.updateOne(dataQueryId, { options });
      dataQuery['options'] = options;
    }

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, environmentId, mode, app);
  }

  async runQueryForApp(user: User, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto, response: Response, app?: App) {
    const { resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, { dataSource: true });

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, undefined, 'view', app);
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
    app?: App
  ): Promise<object> {
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
        undefined // opts parameter
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

    return result;
  }

  async listTablesForApp(user: User, dataSource: DataSource, environmentId: string) {
    let result = {};
    try {
      result = await this.dataQueryUtilService.listTables(user, dataSource, environmentId);
    } catch (error) {
      if (error.constructor.name === 'QueryError') {
        result = {
          status: 'failed',
          message: error.message,
          description: error.description,
          data: error.data,
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
    return result;
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
