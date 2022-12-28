import { ConnectionTestResult, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import MindsDB from 'mindsdb-js-sdk';

export default class Mindsdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    this.connect(sourceOptions);
    return {
      status: 'ok',
      data: {},
    };
  }
  connect(sourceOptions: SourceOptions) {
    MindsDB.connect(sourceOptions.url, [{ key: 'apikey', value: sourceOptions.apikey }]);
  }
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    this.connect(sourceOptions);
    const result = await MindsDB.ping();
    return {
      status: result ? 'ok' : 'failed',
    };
  }
}
