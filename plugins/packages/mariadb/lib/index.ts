import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  getCachedConnection,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const mariadb = require('mariadb');

export default class Mariadb implements QueryService {
  private defaultConnectionLimit = '10';

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    const checkCache = true;
    let conn;
    const mariadbConnectionPool = await this.getConnection(
      sourceOptions,
      {},
      checkCache,
      dataSourceId,
      dataSourceUpdatedAt
    );
    try {
      conn = await mariadbConnectionPool.getConnection();
      const rows = await conn.query(queryOptions.query);
      const result = this.toJson(rows);
      return {
        status: 'ok',
        data: result,
      };
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    } finally {
      if (conn) conn.release(); // Release the connection back to the pool
      if (!checkCache) await mariadbConnectionPool.end();
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    let conn;
    try {
      conn = await this.buildTestConnection(sourceOptions);
      const rows = await conn.query('SELECT 1 as val');

      if (!rows) {
        throw new Error('Connection test returned no results');
      }
      return {
        status: 'ok',
      };
    } catch (error) {
      throw new QueryError(`Connection test failed: ${error.sqlMessage}`, error.message, {});
    } finally {
      if (conn) conn.end();
    }
  }

  private buildConnectionPool(sourceOptions: SourceOptions): Promise<any> {
    const connectionLimit =
      sourceOptions.connectionLimit && sourceOptions.connectionLimit !== ''
        ? sourceOptions.connectionLimit
        : this.defaultConnectionLimit;

    // Timeout to get a new connection from pool in ms. - acquireTimeout : Default is 10000ms
    const poolConfig = {
      host: sourceOptions.host,
      user: sourceOptions.user,
      password: sourceOptions.password,
      port: sourceOptions.port,
      database: sourceOptions.database,
      multipleStatements: true,
      connectionLimit: connectionLimit, // Maximum number of connections in the pool - Updated to 10 from 5
      connectTimeout: 60000, // 60 seconds - Sets the connection timeout in milliseconds.
      minConnections: 0, // Minimum idle connections in the pool
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
      const mariadbPool = mariadb.createPool(poolConfig);
      mariadbPool.on('error', (error) => {
        console.error(error);
      });

      return mariadbPool;
    } catch (error) {
      console.error('Error while creating database connection pool:', error.message);
      throw new QueryError('Database connection failed', error.message, {});
    }
  }

  private async buildTestConnection(sourceOptions: SourceOptions): Promise<any> {
    const connectionConfig = {
      host: sourceOptions.host,
      user: sourceOptions.user,
      password: sourceOptions.password,
      port: sourceOptions.port,
      database: sourceOptions.database,
      connectTimeout: 60000, // 60 seconds - Sets the connection timeout in milliseconds.
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

    if (sourceOptions.ssl_enabled) connectionConfig['ssl'] = sslObject;

    try {
      const conn = await mariadb.createConnection(connectionConfig);
      return conn;
    } catch (error) {
      console.error('Error while establishing database connection:', error.message);
      throw new QueryError('Database connection failed', error.message, {});
    }
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId: string,
    dataSourceUpdatedAt?: string
  ): Promise<any> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      const cachedConnectionPool = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);
      if (cachedConnectionPool) return cachedConnectionPool;

      const connectionPool = this.buildConnectionPool(sourceOptions);
      cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connectionPool);
      return connectionPool;
    }
    return this.buildConnectionPool(sourceOptions);
  }

  private toJson(data) {
    return JSON.parse(
      JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(/"(-?\d+)n"/g, (_, a) => a)
    );
  }
}
