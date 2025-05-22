import { Response } from 'express';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { CreateDataQueryDto, IUpdatingReferencesOptions, UpdateDataQueryDto } from '../dto';
import { DataQuery } from '@entities/data_query.entity';

export interface IDataQueriesService {
  getAll(user: User, versionId: string, mode?: string): Promise<{ data_queries: object[] }>;

  create(user: User, dataSource: DataSource, dataQueryDto: CreateDataQueryDto): Promise<object>;

  update(user: User, versionId: string, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto): Promise<void>;

  delete(dataQueryId: string): Promise<void>;

  bulkUpdateQueryOptions(user: User, dataQueriesOptions: IUpdatingReferencesOptions[]): Promise<object[]>;

  runQueryOnBuilder(
    user: User,
    dataQueryId: string,
    environmentId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    ability: object,
    dataSource: DataSource,
    response: Response
  ): Promise<object>;

  runQueryForApp(
    user: User,
    dataQueryId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    response: Response
  ): Promise<object>;

  preview(
    user: User,
    dataQuery: DataQuery,
    environmentId: string,
    options: object,
    response: Response
  ): Promise<object>;

  changeQueryDataSource(user: User, queryId: string, dataSource: DataSource, newDataSourceId: string): Promise<void>;
}
