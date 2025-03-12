import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import PrestoClient from '@prestodb/presto-js-client';

export default class Presto implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const prestoClient = await this.getConnection(sourceOptions);
    const { presto_sql_query } = queryOptions;

    try {
      const prestoQueryResult = await prestoClient.query(presto_sql_query);
      return {
        status: 'ok',
        data: prestoQueryResult,
      };
    } catch (error) {
      throw new QueryError('Query could not be completed', error, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const {
      db_auth_username,
      db_auth_password,
      db_config_catalog,
      db_config_host,
      db_config_port,
      db_config_schema,
      db_config_user,
      db_config_timezone,
      db_config_extra_headers,
    } = sourceOptions;

    const headersObj =
      db_config_extra_headers
        ?.filter(([key, value]) => key !== '' && value !== '')
        ?.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {}) || {};

    const client = new PrestoClient({
      basicAuthentication: {
        user: db_auth_username,
        password: db_auth_password,
      },
      catalog: db_config_catalog,
      ...(Object.keys(headersObj).length > 0 && { extraHeaders: headersObj }),
      host: db_config_host,
      port: db_config_port,
      schema: db_config_schema,
      timezone: db_config_timezone,
      user: db_config_user,
    });

    return client;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const prestoClient = await this.getConnection(sourceOptions);

    try {
      const result = await prestoClient.query('select 1');
      if (result.data[0][0] === 1) {
        return { status: 'ok' };
      }
    } catch (error) {
      return {
        status: 'failed',
        message: error?.message ?? 'Failed to establish connection',
      };
    }
  }
}
