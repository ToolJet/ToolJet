import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class Athena implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
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
      s3: sourceOptions.output_location,
      getStats: true,
    };

    const athenaExpress = new AthenaExpress(athenaExpressConfig);
    const myQuery = {
      sql: queryOptions.query,
      db: sourceOptions.database,
    };

    try {
      result = await athenaExpress.query(myQuery);
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
    const athenaExpress = new AthenaExpress(awsCredentials);
    const myQuery = {
      sql: 'SELECT * FROM Customers',
      db: sourceOptions.database,
    };
    const client = athenaExpress
      .query(myQuery)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        throw new Error('Invalid credentials');
      });
    return { client };
  }
}
