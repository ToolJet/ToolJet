import { Response } from 'express';
import { User } from '@entities/user.entity';
import { DataSource } from '@entities/data_source.entity';

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
    environmentId?: string
  ): Promise<object>;

  fetchServiceAndParsedParams(
    dataSource: DataSource,
    dataQuery: any,
    queryOptions: object,
    organization_id: string,
    environmentId?: string,
    user?: User
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
    user?: User
  ): Promise<object>;
}
