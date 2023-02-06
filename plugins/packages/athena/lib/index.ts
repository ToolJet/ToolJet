import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const AthenaExpress = require('athena-express');
const AWS = require('aws-sdk');

export default class Athena implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    let result = {};
    const athenaClient = await this.getConnection(sourceOptions);
    const myQuery = {
      sql: queryOptions.query,
      db: sourceOptions.database,
      ...(queryOptions.pagination?.length > 0 && { pagination: queryOptions.pagination }),
      ...(queryOptions?.nextToken?.length > 0 && { nextToken: queryOptions.nextToken }),
      ...(queryOptions?.queryExecutionId?.length > 0 && { queryExecutionId: queryOptions.queryExecutionId }),
    };

    try {
      const data = await athenaClient.query(myQuery);
      result = this.toJson(data);
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
    await athenaClient.query('SHOW TABLES');

    return {
      status: 'ok',
    };
  }
  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const region = sourceOptions['region'];

    let credentials = null;
    if (useAWSInstanceProfile) {
      credentials = new AWS.EC2MetadataCredentials({ httpOptions: { timeout: 5000 } });
    } else {
      credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
    }

    const awsCredentials = {
      region,
      credentials,
    };

    AWS.config.update(awsCredentials);

    const athenaExpressConfig = {
      aws: AWS,
      db: sourceOptions.database,
      ...(sourceOptions?.output_location?.length > 0 && { s3: sourceOptions?.output_location }),
    };

    const athenaExpress = new AthenaExpress(athenaExpressConfig);
    return athenaExpress;
  }
  private toJson(data) {
    return JSON.parse(
      JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(/"(-?\d+)n"/g, (_, a) => a)
    );
  }
}
