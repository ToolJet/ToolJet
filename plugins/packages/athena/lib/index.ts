import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class Athena implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    const AthenaExpress = require('athena-express'),
      AWS = require('aws-sdk'),
      awsCredentials = {
        region: 'YOUR_AWS_REGION',
        accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
        secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
      };

    AWS.config.update(awsCredentials);

    const athenaExpressConfig = {
      aws: AWS,
      s3: 's3://my-bucket-for-storing-athena-results-us-east-1',
      getStats: true,
    };

    const athenaExpress = new AthenaExpress(athenaExpressConfig);
    const myQuery = {
      sql: 'SELECT elb_name, request_port, request_ip FROM elb_logs LIMIT 3',
      db: 'sampledb',
    };

    try {
      result = await athenaExpress.query(myQuery);
      console.log(result);
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

  async getConnection(sourceOptions: SourceOptions, options?: object): Promise<any> {
    const credentials = {
      accessKeyId: sourceOptions['access_key'],
      secretAccessKey: sourceOptions['secret_key'],
    };
    return { region: sourceOptions['region'], credentials };
  }
}
