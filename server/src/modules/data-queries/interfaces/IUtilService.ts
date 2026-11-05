import { Response } from 'express';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';
import { App } from '@entities/app.entity';
import * as ivm from 'isolated-vm';

export interface WorkflowExecutionOptions {
  bundleContent?: string | null;
  isolate?: ivm.Isolate | null;
  context?: ivm.Context | null;
}

export interface DataQueryExecutionOptions {
  workflow?: WorkflowExecutionOptions;
  // EE query response cache. refresh: skip lookup and replace this run's entry (editor Preview).
  // clearAll (with refresh): first invalidate every cached variant of the query (run refresh).
  responseCache?: { refresh?: boolean; clearAll?: boolean };
}

export interface IDataQueriesUtilService {
  validateQueryActionsAgainstEnvironment(
    organizationId: string,
    appVersionId: string,
    errorMessage: string
  ): Promise<void>;

  runQuery(
    user: User,
    dataQuery: any,
    queryOptions: object,
    response: Response,
    environmentId?: string,
    mode?: string,
    app?: App,
    opts?: DataQueryExecutionOptions
  ): Promise<object>;

  fetchServiceAndParsedParams(
    dataSource: DataSource,
    dataQuery: any,
    queryOptions: object,
    organization_id: string,
    environmentId?: string,
    user?: User,
    opts?: DataQueryExecutionOptions
  ): Promise<{
    service: any;
    sourceOptions: object;
    parsedQueryOptions: object;
  }>;

  setCookiesBackToClient(response: Response, responseHeaders: any): void;

  parseQueryOptions(
    object: any,
    options: object,
    organization_id: string,
    environmentId?: string,
    user?: User,
    opts?: DataQueryExecutionOptions
  ): Promise<object>;
}
