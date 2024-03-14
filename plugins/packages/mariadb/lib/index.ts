import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const mariadb = require('mariadb');
export default class Mariadb implements QueryService {
  private defaultConnectionLimit = '5';
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    let result = {};
    const mariadbClient = await this.getConnection(sourceOptions);
    try {
      const rows = await mariadbClient.query(queryOptions.query);
      result = this.toJson(rows);
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const conn = await this.getConnection(sourceOptions);
      const rows = await conn.query('SELECT 1 as val');

      if (!rows) {
        throw new Error('Connection test returned no results');
      }
      return {
        status: 'ok',
      };
    } catch (error) {
      throw new QueryError(`Connection test failed: ${error.sqlMessage}`, error.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const connectionLimit =
      sourceOptions.connectionLimit && sourceOptions.connectionLimit !== ''
        ? sourceOptions.connectionLimit
        : this.defaultConnectionLimit;
    const poolConfig = {
      host: sourceOptions.host,
      user: sourceOptions.user,
      password: sourceOptions.password,
      connectionLimit: connectionLimit,
      port: sourceOptions.port,
      database: sourceOptions.database,
    };

    const sslObject = { rejectUnauthorized: (sourceOptions.ssl_certificate ?? 'none') != 'none' };
    if (sourceOptions.ssl_certificate === 'ca_certificate') {
      sslObject['ca'] = sourceOptions.ca;
    }
    if (sourceOptions.ssl_certificate === 'self_signed') {
      sslObject['ca'] = sourceOptions.ca;
      sslObject['cert'] = sourceOptions.cert;
      sslObject['key'] = sourceOptions.key;
    }

    if (sourceOptions.ssl_enabled) poolConfig['ssl'] = sslObject;

    try {
      const mariadbPool = await mariadb.createPool(poolConfig);
      mariadbPool.on('error', (error) => {
        console.error(error);
      });

      return mariadbPool.getConnection();
    } catch (error) {
      console.error('Error while establishing database connection:', error.message);
      throw new QueryError('Database connection failed', error.message, {});
    }
  }

  private toJson(data) {
    return JSON.parse(
      JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(/"(-?\d+)n"/g, (_, a) => a)
    );
  }
}
