import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import harperive from 'harperive';
import JSON5 from 'json5';

export default class Harperdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const harperdbClient = await this.getConnection(sourceOptions);
    const { operation, mode } = queryOptions;
    let result = {};

    try {
      if (mode === 'sql') {
        const { sql_query } = queryOptions;
        const sql_operation_response = await harperdbClient.query(sql_query);
        result = sql_operation_response?.data;
      }

      if (mode === 'nosql') {
        switch (operation) {
          case 'describe_all':
            const describe_all_response = await harperdbClient.describeAll()
            result = describe_all_response.data
            break;
          case 'insert':
            const insert_response = await harperdbClient.insert({
              schema: queryOptions.schema,
              table: queryOptions.table,
              records: JSON5.parse(queryOptions.records)
            })
            result = insert_response.data
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
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { host, username, password } = sourceOptions

    const DB_CONFIG = {
      harperHost: host,
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
