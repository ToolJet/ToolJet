import { SeaTableClient } from './seatable_client';
import { SourceOptions, QueryOptions } from './types';

let cachedClient: SeaTableClient | null = null;
let cachedKey = '';

function getClient(sourceOptions: SourceOptions): SeaTableClient {
  const serverUrl = sourceOptions.server_url;
  const apiToken = sourceOptions.api_token;
  if (!serverUrl || !apiToken) {
    throw new Error('Missing server_url or api_token in connection settings');
  }
  const key = `${serverUrl}::${apiToken}`;
  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }
  cachedClient = new SeaTableClient(serverUrl, apiToken);
  cachedKey = key;
  return cachedClient;
}

function parseJson(value: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) return value;
  try {
    return JSON.parse(value as string);
  } catch {
    throw new Error(`Invalid JSON: ${String(value)}`);
  }
}

export const queryOperations = {
  async listRows(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<object> {
    const client = getClient(sourceOptions);
    const tableName = queryOptions.table_name;
    const page = parseInt(String(queryOptions.page ?? '1'), 10) || 1;
    const pageSize = parseInt(String(queryOptions.page_size ?? '100'), 10) || 100;

    if (!tableName) throw new Error('table_name is required');
    return client.listRows(tableName, page, pageSize);
  },

  async getRow(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<object> {
    const client = getClient(sourceOptions);
    const tableName = queryOptions.table_name;
    const rowId = queryOptions.row_id;

    if (!tableName) throw new Error('table_name is required');
    if (!rowId) throw new Error('row_id is required');
    return client.getRow(tableName, rowId);
  },

  async createRow(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<object> {
    const client = getClient(sourceOptions);
    const tableName = queryOptions.table_name;
    if (!queryOptions.row_data) throw new Error('row_data is required');
    const rowData = parseJson(queryOptions.row_data);

    if (!tableName) throw new Error('table_name is required');
    return client.createRow(tableName, rowData);
  },

  async updateRow(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<object> {
    const client = getClient(sourceOptions);
    const tableName = queryOptions.table_name;
    const rowId = queryOptions.row_id;
    if (!queryOptions.row_data) throw new Error('row_data is required');
    const rowData = parseJson(queryOptions.row_data);

    if (!tableName) throw new Error('table_name is required');
    if (!rowId) throw new Error('row_id is required');
    return client.updateRow(tableName, rowId, rowData);
  },

  async deleteRow(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<object> {
    const client = getClient(sourceOptions);
    const tableName = queryOptions.table_name;
    const rowId = queryOptions.row_id;

    if (!tableName) throw new Error('table_name is required');
    if (!rowId) throw new Error('row_id is required');
    return client.deleteRow(tableName, rowId);
  },

  async searchRows(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<object> {
    const client = getClient(sourceOptions);
    const sql = queryOptions.sql_query;

    if (!sql) throw new Error('sql_query is required');
    return client.querySql(sql);
  },

  async getMetadata(sourceOptions: SourceOptions): Promise<object> {
    const client = getClient(sourceOptions);
    return client.getMetadata();
  },
};
