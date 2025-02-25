import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { DataSourceTypes } from '@modules/data-sources/constants';
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
@Injectable()
export class DataQueriesService implements IDataQueriesService {
  constructor(
    protected readonly dataQueryRepository: DataQueryRepository,
    protected readonly dataQueryUtilService: DataQueriesUtilService,
    protected readonly dataSourceRepository: DataSourcesRepository
  ) {}

  async getAll(versionId: string) {
    const queries = await this.dataQueryRepository.getAll(versionId);
    const serializedQueries = [];

    // serialize
    for (const query of queries) {
      if (query.dataSource.type === DataSourceTypes.STATIC) {
        delete query['dataSourceId'];
      }
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
    response: Response
  ) {
    const { options, resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, { dataSource: true, apps: true });

    if (ability.can(FEATURE_KEY.UPDATE_ONE, DataSource, dataSource.id) && !isEmpty(options)) {
      await this.dataQueryRepository.updateOne(dataQueryId, { options });
      dataQuery['options'] = options;
    }

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response, environmentId);
  }

  async runQueryForApp(user: User, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto, response: Response) {
    const { resolvedOptions } = updateDataQueryDto;

    const dataQuery = await this.dataQueryRepository.getOneById(dataQueryId, { dataSource: true, apps: true });

    return this.runAndGetResult(user, dataQuery, resolvedOptions, response);
  }

  async preview(user: User, dataQuery: DataQuery, environmentId: string, options: any, response: Response) {
    return this.runAndGetResult(user, dataQuery, options, response, environmentId);
  }

  private async runAndGetResult(
    user: User,
    dataQuery: DataQuery,
    resolvedOptions: object,
    response: Response,
    environmentId?: string
  ): Promise<object> {
    let result = {};

    try {
      result = await this.dataQueryUtilService.runQuery(user, dataQuery, resolvedOptions, response, environmentId);
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
      const newDataSource = await this.dataSourceRepository.findOne({ where: { id: newDataSourceId } });
      if (dataSource.kind !== newDataSource.kind) {
        throw new BadRequestException();
      }
      return this.dataQueryRepository.updateOne(queryId, { dataSourceId: newDataSourceId }, manager);

      // TODO: Audit logs
    });
  }
}
