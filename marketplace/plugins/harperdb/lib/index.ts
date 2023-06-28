import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import harperive from 'harperive';
import JSON5 from 'json5';

export default class Harperdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const harperdbClient = await this.getConnection(sourceOptions);
    const { operation, mode } = queryOptions;
    let result: any = {};

    try {
      if (mode === 'sql') {
        const { sql_query } = queryOptions;
        result = await harperdbClient.query(sql_query);
      }

      if (mode === 'nosql') {
        switch (operation) {
          case 'insert':
            result = await harperdbClient.insert({
              schema: queryOptions.schema,
              table: queryOptions.table,
              records: JSON5.parse(queryOptions.records)
            })
            break;
          default:
            break;
        }
      }
    } catch (err) {
      throw new QueryError('Query could not be completed', err.error, {})
    }

    return {
      status: 'ok',
      data: result?.data ?? {},
    };
  }

  determineProtocol(sourceOptions: SourceOptions) {
    const { ssl_enabled} = sourceOptions;
    if (ssl_enabled === undefined) return 'https';
    return ssl_enabled ? 'https' : 'http';
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { host, port, username, password } = sourceOptions
    const protocol = this.determineProtocol(sourceOptions);

    const DB_CONFIG = {
      harperHost: `${protocol}://${host}:${port}`,
      username: username,
      password: password,
      token: '',
      schema: ''
    }

    const Client = harperive.Client;
    const client = new Client(DB_CONFIG);

    return client;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const harperdb = await this.getConnection(sourceOptions);

    try {
      const res = await harperdb.describeAll();
      if (res.statusCode === 200) return { status: 'ok' };
      return { status: 'failed', message: 'Invalid credentials' };

    } catch (error) {
      return {
        status: 'failed',
        message: error?.error ?? 'Invalid credentials'
      }
    }
  }
}
