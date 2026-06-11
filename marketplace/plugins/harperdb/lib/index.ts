import axios, { AxiosInstance } from 'axios';
import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import JSON5 from 'json5';

class HarperDBClient {
  private client: AxiosInstance;

  constructor(config: { host: string; port: number; username: string; password: string; ssl?: boolean }) {
    const protocol = config.ssl === false ? 'http' : 'https';
    const portPart = config.port ? `:${config.port}` : '';

    this.client = axios.create({
      baseURL: `${protocol}://${config.host}${portPart}`,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  private async request(body: Record<string, any>) {
    const { data } = await this.client.post('', body);
    return data;
  }

  // SQL
  query(sql: string) {
    return this.request({
      operation: 'sql',
      sql,
    });
  }

  // NoSQL
  insert(payload: any) {
    return this.request({ operation: 'insert', ...payload });
  }

  update(payload: any) {
    return this.request({ operation: 'update', ...payload });
  }

  delete(payload: any) {
    return this.request({ operation: 'delete', ...payload });
  }

  searchByHash(payload: any) {
    return this.request({ operation: 'search_by_hash', ...payload });
  }

  searchByValue(payload: any) {
    return this.request({ operation: 'search_by_value', ...payload });
  }

  executeOperation(payload: any) {
    return this.request(payload);
  }

  describeAll() {
    return this.request({ operation: 'describe_all' });
  }
}

export default class Harperdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const harperdbClient = await this.getConnection(sourceOptions);
    const { operation, mode } = queryOptions;
    let result: any = {};

    try {
      if (mode === 'sql') {
        result = await harperdbClient.query(queryOptions.sql_query);
      }

      if (mode === 'nosql') {
        switch (operation) {
          case 'insert':
            result = await harperdbClient.insert({
              schema: queryOptions.schema,
              table: queryOptions.table,
              records: JSON5.parse(queryOptions.records),
            });
            break;

          case 'update':
            result = await harperdbClient.update({
              schema: queryOptions.schema,
              table: queryOptions.table,
              records: JSON5.parse(queryOptions.records),
            });
            break;

          case 'delete':
            result = await harperdbClient.delete({
              schema: queryOptions.schema,
              table: queryOptions.table,
              hash_values: JSON5.parse(queryOptions.hash_values),
            });
            break;

          case 'search_by_hash':
            result = await harperdbClient.searchByHash({
              schema: queryOptions.schema,
              table: queryOptions.table,
              hash_values: JSON5.parse(queryOptions.hash_values),
              get_attributes: JSON5.parse(queryOptions.attributes),
            });
            break;

          case 'search_by_value':
            result = await harperdbClient.searchByValue({
              schema: queryOptions.schema,
              table: queryOptions.table,
              search_attribute: queryOptions.search_attribute,
              search_value: queryOptions.search_value,
              get_attributes: JSON5.parse(queryOptions.attributes),
            });
            break;

          case 'search_by_conditions':
            result = await harperdbClient.executeOperation({
              operation: 'search_by_conditions',
              schema: queryOptions.schema,
              table: queryOptions.table,
              ...(queryOptions.operator && { operator: queryOptions.operator }),
              ...(queryOptions.offset !== undefined && { offset: queryOptions.offset }),
              ...(queryOptions.limit !== undefined && { limit: queryOptions.limit }),
              get_attributes: JSON5.parse(queryOptions.attributes),
              conditions: JSON5.parse(queryOptions.conditions),
            });
            break;

          default:
            break;
        }
      }
    } catch (err: any) {
      throw new QueryError('Query could not be completed', err?.response?.data ?? err?.message, {});
    }

    return {
      status: 'ok',
      data: result?.data ?? result ?? {},
    };
  }

  determineProtocol(sourceOptions: SourceOptions) {
    if (sourceOptions.ssl_enabled === undefined) return 'https';
    return sourceOptions.ssl_enabled ? 'https' : 'http';
  }

  async getConnection(sourceOptions: SourceOptions): Promise<HarperDBClient> {
    const { host, port, username, password } = sourceOptions;

    return new HarperDBClient({
      host,
      port: Number(port),
      username,
      password,
      ssl: sourceOptions.ssl_enabled,
    });
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const harperdb = await this.getConnection(sourceOptions);
      const res = await harperdb.describeAll();

      if (res?.error) {
        return {
          status: 'failed',
          message: res.error,
        };
      }

      return {
        status: 'ok',
        data: res,
      };
    } catch (error: any) {
      return {
        status: 'failed',
        message: error?.response?.data || error || 'Invalid credentials',
      };
    }
  }
}
