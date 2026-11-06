import { Response } from 'express';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import {
  AddToLibraryDto,
  CreateDataQueryDto,
  IUpdatingReferencesOptions,
  RunLibraryQueryDto,
  UpdateDataQueryDto,
} from '../dto';
import { DataQuery } from '@entities/data_query.entity';
import { App } from '@entities/app.entity';

/**
 * Context interfaces for history capture hooks
 */
export interface QueryCreateContext {
  name: string;
  options: object;
  dataSourceId: string;
  appVersionId: string;
}

export interface QueryUpdateContext {
  dataQueryId: string;
  updateDto: UpdateDataQueryDto;
  oldQueryDto: any;
  queryName: string;
}

export interface QueryDeleteContext {
  dataQueryId: string;
  queryName: string;
  appVersionId: string | null;
}

export interface IDataQueriesService {
  getAll(user: User, app: App, versionId: string, mode?: string): Promise<{ data_queries: object[] }>;

  create(user: User, dataSource: DataSource, dataQueryDto: CreateDataQueryDto): Promise<object>;

  update(user: User, versionId: string, dataQueryId: string, updateDataQueryDto: UpdateDataQueryDto): Promise<void>;

  delete(dataQueryId: string, versionId: string): Promise<void>;

  addToLibrary(
    user: User,
    app: App,
    dataQueryId: string,
    versionId: string,
    dto: AddToLibraryDto
  ): Promise<{
    query: { id: string; name: string; kind: 'library'; data_source_id: string; options: Record<string, unknown> };
    libraryQueryId: string;
    libraryVersionId: string;
  }>;

  bulkUpdateQueryOptions(user: User, dataQueriesOptions: IUpdatingReferencesOptions[]): Promise<object[]>;

  runQueryOnBuilder(
    user: User,
    dataQueryId: string,
    environmentId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    ability: object,
    dataSource: DataSource,
    response: Response,
    mode?: string
  ): Promise<object>;

  runQueryForApp(
    user: User,
    dataQueryId: string,
    updateDataQueryDto: UpdateDataQueryDto,
    response: Response
  ): Promise<object>;

  getLibraryDefinition(consumerQueryId: string, app: App, user?: User): Promise<object>;

  runLibraryQuery(
    user: User,
    consumerQueryId: string,
    dto: RunLibraryQueryDto,
    response: Response,
    app: App,
    environmentId?: string
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
