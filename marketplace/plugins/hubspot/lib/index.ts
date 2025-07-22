import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

export default class Hubspot implements QueryService {
  authUrl(source_options: SourceOptions): string {}

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    return {
      status: 'ok',
      data: {},
    };
  }
}
