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
          case 'update': {
            result = await harperdbClient.update({
              schema: queryOptions.schema,
              table: queryOptions.table,
              records: JSON5.parse(queryOptions.records)
            })
            break;
          }
          case 'delete': {
            result = await harperdbClient.delete({
              schema: queryOptions.schema,
              table: queryOptions.table,
              hashValues: JSON5.parse(queryOptions.hash_values)
            })
            break;
          }
          case 'search_by_hash': {
            result = await harperdbClient.searchByHash({
              schema: queryOptions.schema,
              table: queryOptions.table,
              hashValues: JSON5.parse(queryOptions.hash_values),
              attributes: JSON5.parse(queryOptions.attributes)
            })
            break;
          }
          case 'search_by_value': {
            result = await harperdbClient.searchByValue({
              schema: queryOptions.schema,
              table: queryOptions.table,
              searchAttribute: queryOptions.search_attribute,
              searchValue: queryOptions.search_value,
              attributes: JSON5.parse(queryOptions.attributes)
            })
            break;
          }
          case 'search_by_conditions': {
            result = await harperdbClient.executeOperation({
              operation: "search_by_conditions",
              schema: queryOptions.schema,
              table: queryOptions.table,
              ...(queryOptions?.operator && {operator: queryOptions.operator}),
              ...(queryOptions?.offset && {offset: queryOptions.offset}),
              ...(queryOptions?.limit && { limit: queryOptions.limit }),
              get_attributes: JSON5.parse(queryOptions.attributes),
              conditions: JSON5.parse(queryOptions.conditions)
            })
          }
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
    const { ssl_enabled } = sourceOptions;
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
