import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { queryOperations } from './query_operations';
import { SourceOptions, QueryOptions } from './types';

export default class SeaTableQueryService implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId?: string,
    _dataSourceUpdatedAt?: string,
    _context?: Record<string, unknown>
  ): Promise<QueryResult> {
    const operation = queryOptions.operation;

    try {
      let result: object;

      switch (operation) {
        case 'list_rows':
          result = await queryOperations.listRows(sourceOptions, queryOptions);
          break;
        case 'get_row':
          result = await queryOperations.getRow(sourceOptions, queryOptions);
          break;
        case 'create_row':
          result = await queryOperations.createRow(sourceOptions, queryOptions);
          break;
        case 'update_row':
          result = await queryOperations.updateRow(sourceOptions, queryOptions);
          break;
        case 'delete_row':
          result = await queryOperations.deleteRow(sourceOptions, queryOptions);
          break;
        case 'search_rows':
          result = await queryOperations.searchRows(sourceOptions, queryOptions);
          break;
        case 'get_metadata':
          result = await queryOperations.getMetadata(sourceOptions);
          break;
        default:
          throw new QueryError(`Unknown operation: ${operation}`, '', {});
      }

      return { status: 'ok', data: result };
    } catch (error: unknown) {
      if (error instanceof QueryError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new QueryError(message, '', {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      await queryOperations.getMetadata(sourceOptions);
      return { status: 'ok' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      return { status: 'failed', message };
    }
  }
}
