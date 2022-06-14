import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class Athena implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    const athenaClient = await this.getConnection(sourceOptions);
    const myQuery = {
      sql: queryOptions.query,
      db: sourceOptions.database,
    };

    try {
      console.log(
        JSON.stringify(myQuery, (_, myQuery) => (typeof myQuery === 'bigint' ? myQuery.toString() : myQuery))
      );
      result = await athenaClient.query(this.toObject(myQuery));
      console.log('result ::: ', result);
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const athenaClient = await this.getConnection(sourceOptions);
    try {
      await athenaClient.query('SHOW TABLES');
    } catch (error) {
      throw new Error(error);
    }
    return {
      status: 'ok',
    };
  }
  async getConnection(sourceOptions: SourceOptions, queryOptions?: QueryOptions): Promise<any> {
    const AthenaExpress = require('athena-express'),
      AWS = require('aws-sdk'),
      awsCredentials = {
        region: sourceOptions.region,
        accessKeyId: sourceOptions.access_key,
        secretAccessKey: sourceOptions.secret_key,
      };

    AWS.config.update(awsCredentials);

    const athenaExpressConfig = {
      aws: AWS,
      getStats: true,
      db: sourceOptions.database,
      ...(sourceOptions.output_location?.length > 0 && { s3: sourceOptions.output_location }),
    };

    const athenaExpress = new AthenaExpress(athenaExpressConfig);
    return athenaExpress;
  }
  private toObject(data) {
    const val = typeof data === 'bigint' ? data.toString() : data;
    const newVal = JSON.parse(JSON.stringify(val));
    return newVal;
  }
}
