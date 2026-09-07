import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { createTavilyClient, search, qnaSearch, extract } from './operations';

export default class Tavily implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, _dataSourceId?: string): Promise<QueryResult> {
    if (!sourceOptions.api_key) {
      throw new QueryError('API Key is missing', 'Please configure your Tavily API Key in datasource settings', {});
    }

    const client = createTavilyClient(sourceOptions);
    let result = {};

    try {
      switch (queryOptions.operation) {
        case 'search':
          result = await search(client, sourceOptions, queryOptions);
          break;
        case 'qna_search':
          result = await qnaSearch(client, sourceOptions, queryOptions);
          break;
        case 'extract':
          result = await extract(client, sourceOptions, queryOptions);
          break;
        default:
          throw new Error(`Unsupported operation: ${(queryOptions as any).operation}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      throw new QueryError('Query execution failed', errorMessage, {
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    if (!sourceOptions.api_key) {
      throw new Error('API Key is required to test connection');
    }

    const client = createTavilyClient(sourceOptions);
    try {
      await client.post('/search', {
        api_key: sourceOptions.api_key,
        query: 'ping',
        max_results: 1,
      });

      return {
        status: 'ok',
      };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      throw new Error(`Connection test failed: ${msg}`);
    }
  }
}
