import axios, { AxiosInstance } from 'axios';
import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

const BASE_URL = 'https://api.cloudflare.com/client/v4';

const getErrorMessage = (error: any): string => {
  const cloudflareErrors = error?.response?.data?.errors;
  if (Array.isArray(cloudflareErrors) && cloudflareErrors.length > 0) {
    return cloudflareErrors.map((e: any) => e.message || JSON.stringify(e)).join('; ');
  }
  const cloudflareMessages = error?.response?.data?.messages;
  if (Array.isArray(cloudflareMessages) && cloudflareMessages.length > 0) {
    return cloudflareMessages.map((m: any) => m.message || JSON.stringify(m)).join('; ');
  }
  return error?.response?.data?.error || error?.message || 'Unknown error occurred';
};

export const parseParams = (params: any): any[] => {
  if (params === undefined || params === null || params === '') {
    return [];
  }
  if (Array.isArray(params)) {
    return params;
  }
  if (typeof params === 'string') {
    const trimmed = params.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [parsed];
    } catch {
      if (trimmed.includes(',')) {
        return trimmed.split(',').map((s) => s.trim());
      }
      return [trimmed];
    }
  }
  return [params];
};

export class CloudflareD1Client {
  private client: AxiosInstance;
  private accountId: string;

  constructor(sourceOptions: SourceOptions) {
    if (!sourceOptions?.account_id || !sourceOptions.account_id.trim()) {
      throw new Error('Account ID is required');
    }
    if (!sourceOptions?.api_token || !sourceOptions.api_token.trim()) {
      throw new Error('API token is required');
    }

    this.accountId = encodeURIComponent(sourceOptions.account_id.trim());
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${sourceOptions.api_token.trim()}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async listDatabases(params?: { name?: string; page?: number | string; per_page?: number | string }) {
    const queryParams: Record<string, any> = {};
    if (params?.name && params.name.trim()) queryParams.name = params.name.trim();
    if (params?.page !== undefined && params?.page !== '') queryParams.page = params.page;
    if (params?.per_page !== undefined && params?.per_page !== '') queryParams.per_page = params.per_page;

    const { data } = await this.client.get(`/accounts/${this.accountId}/d1/database`, {
      params: queryParams,
    });
    if (data?.success === false) {
      throw { response: { data } };
    }
    return data;
  }

  async getDatabase(databaseId: string) {
    const encodedDbId = encodeURIComponent(databaseId.trim());
    const { data } = await this.client.get(`/accounts/${this.accountId}/d1/database/${encodedDbId}`);
    if (data?.success === false) {
      throw { response: { data } };
    }
    return data;
  }

  async createDatabase(name: string, primaryLocationHint?: string) {
    const payload: Record<string, any> = {
      name: name.trim(),
    };
    if (primaryLocationHint && primaryLocationHint.trim()) {
      payload.primary_location_hint = primaryLocationHint.trim();
    }
    const { data } = await this.client.post(`/accounts/${this.accountId}/d1/database`, payload);
    if (data?.success === false) {
      throw { response: { data } };
    }
    return data;
  }

  async deleteDatabase(databaseId: string) {
    const encodedDbId = encodeURIComponent(databaseId.trim());
    const { data } = await this.client.delete(`/accounts/${this.accountId}/d1/database/${encodedDbId}`);
    if (data?.success === false) {
      throw { response: { data } };
    }
    return data;
  }

  async query(databaseId: string, sql: string, params: any[] = []) {
    const encodedDbId = encodeURIComponent(databaseId.trim());
    const payload: Record<string, any> = {
      sql: sql.trim(),
    };
    if (params && params.length > 0) {
      payload.params = params;
    }
    const { data } = await this.client.post(`/accounts/${this.accountId}/d1/database/${encodedDbId}/query`, payload);
    if (data?.success === false) {
      throw { response: { data } };
    }
    return data;
  }

  async rawQuery(databaseId: string, sql: string, params: any[] = []) {
    const encodedDbId = encodeURIComponent(databaseId.trim());
    const payload: Record<string, any> = {
      sql: sql.trim(),
    };
    if (params && params.length > 0) {
      payload.params = params;
    }
    const { data } = await this.client.post(`/accounts/${this.accountId}/d1/database/${encodedDbId}/raw`, payload);
    if (data?.success === false) {
      throw { response: { data } };
    }
    return data;
  }
}

export default class Cloudflare_d1 implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result: any;

    try {
      const client = new CloudflareD1Client(sourceOptions);

      switch (queryOptions?.operation) {
        case 'query': {
          if (!queryOptions?.database_id || !queryOptions.database_id.trim()) {
            throw new QueryError('Query could not be completed', 'Database ID is required for running queries', {});
          }
          if (!queryOptions?.sql || !queryOptions.sql.trim()) {
            throw new QueryError('Query could not be completed', 'SQL query is required', {});
          }
          const params = parseParams(queryOptions.params);
          const res = await client.query(queryOptions.database_id, queryOptions.sql, params);
          const statements = res?.result || [];
          if (statements.length === 1) {
            const stmt = statements[0];
            if (Array.isArray(stmt.results) && stmt.results.length > 0) {
              const rows = [...stmt.results];
              Object.defineProperty(rows, 'meta', {
                value: stmt.meta,
                enumerable: false,
                writable: true,
                configurable: true,
              });
              Object.defineProperty(rows, 'success', {
                value: stmt.success,
                enumerable: false,
                writable: true,
                configurable: true,
              });
              result = rows;
            } else {
              result = stmt;
            }
          } else {
            result = statements;
          }
          break;
        }

        case 'raw_query': {
          if (!queryOptions?.database_id || !queryOptions.database_id.trim()) {
            throw new QueryError('Query could not be completed', 'Database ID is required for running raw queries', {});
          }
          if (!queryOptions?.sql || !queryOptions.sql.trim()) {
            throw new QueryError('Query could not be completed', 'SQL query is required', {});
          }
          const params = parseParams(queryOptions.params);
          const res = await client.rawQuery(queryOptions.database_id, queryOptions.sql, params);
          const statements = res?.result || [];
          if (statements.length === 1) {
            const stmt = statements[0];
            if (stmt.results && (stmt.results.columns || stmt.results.rows)) {
              result = {
                columns: stmt.results.columns || [],
                rows: stmt.results.rows || [],
                meta: stmt.meta,
                success: stmt.success,
              };
            } else if (stmt.columns || stmt.rows) {
              result = stmt;
            } else {
              result = stmt;
            }
          } else {
            result = statements;
          }
          break;
        }

        case 'list_databases': {
          const filterParams: any = {};
          if (queryOptions?.name) filterParams.name = queryOptions.name;
          if (queryOptions?.page !== undefined && queryOptions.page !== '') {
            filterParams.page = Number(queryOptions.page);
          }
          if (queryOptions?.per_page !== undefined && queryOptions.per_page !== '') {
            filterParams.per_page = Number(queryOptions.per_page);
          }
          const res = await client.listDatabases(filterParams);
          result = res?.result ?? [];
          break;
        }

        case 'get_database': {
          if (!queryOptions?.database_id || !queryOptions.database_id.trim()) {
            throw new QueryError('Query could not be completed', 'Database ID is required', {});
          }
          const res = await client.getDatabase(queryOptions.database_id);
          result = res?.result ?? {};
          break;
        }

        case 'create_database': {
          if (!queryOptions?.name || !queryOptions.name.trim()) {
            throw new QueryError('Query could not be completed', 'Database name is required', {});
          }
          const res = await client.createDatabase(queryOptions.name, queryOptions.primary_location_hint);
          result = res?.result ?? {};
          break;
        }

        case 'delete_database': {
          if (!queryOptions?.database_id || !queryOptions.database_id.trim()) {
            throw new QueryError('Query could not be completed', 'Database ID is required', {});
          }
          await client.deleteDatabase(queryOptions.database_id);
          result = {
            success: true,
            message: 'Database deleted successfully',
            database_id: queryOptions.database_id,
          };
          break;
        }

        default:
          throw new QueryError('Query could not be completed', `Unsupported operation: ${(queryOptions as any)?.operation}`, {});
      }
    } catch (error: any) {
      if (error instanceof QueryError) {
        throw error;
      }
      throw new QueryError('Query could not be completed', getErrorMessage(error), error?.response?.data || {});
    }

    return {
      status: 'ok',
      data: result ?? {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      if (!sourceOptions?.account_id || !sourceOptions.account_id.trim() || !sourceOptions?.api_token || !sourceOptions.api_token.trim()) {
        return {
          status: 'failed',
          message: 'Account ID and API token are required',
        };
      }
      const client = new CloudflareD1Client(sourceOptions);
      await client.listDatabases({ per_page: 1 });
      return { status: 'ok' };
    } catch (error: any) {
      return {
        status: 'failed',
        message: getErrorMessage(error),
      };
    }
  }
}
