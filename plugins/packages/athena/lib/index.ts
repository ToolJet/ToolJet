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
      getStats: true,
      db: 'mydatabase',
    };

    const athenaExpress = new AthenaExpress(athenaExpressConfig);
    const myQuery = {
      sql: `CREATE DATABASE clickstreams`,
      getStats: true,
    };

    try {
      console.log(JSON.stringify(myQuery, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
      result = await athenaExpress.query('SHOW TABLES');
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
      sql: `SELECT os, COUNT(*) count FROM cloudfront_logs WHERE date BETWEEN date 2014-07-05 AND date 2014-08-05 GROUP BY os`,
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
  private toJson(data) {
    return JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(/"(-?\d+)n"/g, (_, a) => a);
  }
}
