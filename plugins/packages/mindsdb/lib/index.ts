import { ConnectionTestResult, QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import MindsDB from 'mindsdb-js-sdk';

export default class Mindsdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    this.connect(sourceOptions);
    let result = {};
    const operation = queryOptions.operation;
    try {
      switch (operation) {
        case 'list_predictors':
          result = await MindsDB.predictors();
          break;
        case 'list_data_sources':
          result = await MindsDB.dataSources();
          break;
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error, {});
    } finally {
      MindsDB.disconnect();
    }
    return {
      status: 'ok',
      data: result,
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
  /*
  listPredictors
  listDataSources
  getDataSource
  getPredictor
  queryPredictor
  dataSourceLoadData
*/
}
