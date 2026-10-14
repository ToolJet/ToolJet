import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
} from '@tooljet-marketplace/common';
import { createClient } from '@supabase/supabase-js';
import knex, { Knex } from 'knex';
import {
  ConnectionType,
  SourceOptions,
  QueryOptions,
  Column,
  Filter,
  Sort,
  SupabaseClientType,
  SupabaseQueryError,
  SupabaseQueryResult,
  Response,
} from './types';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export default class Supabase implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string
  ): Promise<QueryResult> {
    const operation: string = queryOptions.operation;

    if (this.getConnectionType(sourceOptions) === 'connection_string') {
      if (operation && operation !== 'sql_query') {
        throw new QueryError(
          'Query could not be completed',
          'Row operations need a Secret key or Publishable key connection. Use "Run SQL" with a connection string.',
          {}
        );
      }
      return await this.runSqlQuery(sourceOptions, queryOptions, dataSourceId, dataSourceUpdatedAt);
    }

    if (operation === 'sql_query') {
      throw new QueryError(
        'Query could not be completed',
        'Run SQL needs the "Connection string" connection type on the data source.',
        {}
      );
    }

    const supabaseClient = await this.getConnection(sourceOptions);
    let result: SupabaseQueryResult;
    let error: SupabaseQueryError;
    try {
      if (!operation) throw new Error('Select one operation');
      const { get_table_name, create_table_name, update_table_name, delete_table_name, count_table_name } =
        queryOptions;
      const tableNameValues = {
        get_rows: get_table_name,
        create_row: create_table_name,
        update_row: update_table_name,
        delete_row: delete_table_name,
        count_rows: count_table_name,
      };
      if (!tableNameValues[operation]) throw new Error('Table name is required');
      let res: Response;
      switch (operation) {
        case 'get_rows':
          res = await this.getRows(queryOptions, supabaseClient);
          error = res.error;
          result = res.data;
          break;
        case 'create_row':
          res = await this.createRows(queryOptions, supabaseClient);
          error = res.error;
          result = { created: true };
          break;
        case 'update_row':
          res = await this.updateRows(queryOptions, supabaseClient);
          error = res.error;
          result = res.data;
          break;
        case 'delete_row':
          res = await this.deleteRows(queryOptions, supabaseClient);
          error = res.error;
          result = { deleted: true };
          break;
        case 'count_rows':
          res = await this.countRows(queryOptions, supabaseClient);
          error = res.error;
          result = res.data;
          if (Array.isArray(result)) {
            result = result[0];
          }
          break;
        default:
          break;
      }
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }

    if (error) {
      const errorMessage = error?.message || 'An unknown error occurred.';
      const errorDetails: any = {};

      const supabaseError = error as any;
      const { code, hint } = supabaseError;

      errorDetails.code = code;
      errorDetails.hint = hint;

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getRows(queryOptions: QueryOptions, supabaseClient: SupabaseClientType): Promise<Response> {
    const { get_table_name, get_filters, get_sort, get_limit } = queryOptions;

    let query = supabaseClient.from(get_table_name).select();
    if (get_filters) {
      const getFiltersData: Filter[] = Object.values(get_filters);
      this.addQueryFilters(query, getFiltersData);
    }
    if (get_sort) {
      const getSorts: Sort[] = Object.values(get_sort);
      this.addQuerySort(query, getSorts);
    }
    if (get_limit) {
      query = query.limit(Number(get_limit));
    }
    const res = await query;
    return res;
  }

  async createRows(queryOptions: QueryOptions, supabaseClient: SupabaseClientType): Promise<Response> {
    const { create_table_name, create_body } = queryOptions;
    if (!create_body) throw new Error('Body required to create rows in table');
    const res = await supabaseClient.from(create_table_name).insert(JSON.parse(create_body));
    return res;
  }

  async updateRows(queryOptions: QueryOptions, supabaseClient: SupabaseClientType): Promise<Response> {
    const { update_table_name, update_filters, update_column_fields } = queryOptions;
    if (!update_column_fields) throw new Error('No column(s) provided to update');

    const updateColumnValues: Column[] = Object.values(update_column_fields);
    if (!updateColumnValues.length) throw new Error('No column(s) provided to update');

    const columnNames: string[] = updateColumnValues.map((item) => item.column).filter((columnName) => !!columnName);
    if (!columnNames.length) throw new Error('Provide column(s) with valid data');

    const isDuplicate: boolean = columnNames.some((item, idx) => columnNames.indexOf(item) != idx);
    if (isDuplicate) {
      throw new Error('Duplicate column keys are not allowed');
    }
    const updateQuery = supabaseClient.from(update_table_name).select();
    if (update_filters) {
      const updateFiltersData: Filter[] = Object.values(update_filters);
      this.addQueryFilters(updateQuery, updateFiltersData);
    }
    const { data, error } = await updateQuery;
    if (error) throw new Error('Failed to fetch table rows to update');

    const columnsData: object = {};
    updateColumnValues.forEach((columnObj) => {
      columnsData[columnObj.column] = columnObj.value;
    });
    const updateQueryRes: object[] = data.map((data: object) => ({ ...data, ...columnsData }));
    const res = await supabaseClient.from(update_table_name).upsert(updateQueryRes).select();
    return res;
  }

  async deleteRows(queryOptions: QueryOptions, supabaseClient: SupabaseClientType): Promise<Response> {
    const { delete_table_name, delete_filters, delete_sort, delete_limit } = queryOptions;
    let deleteQuery = supabaseClient.from(delete_table_name).delete();
    if (delete_filters) {
      const deleteFiltersData: Filter[] = Object.values(delete_filters);
      this.addQueryFilters(deleteQuery, deleteFiltersData);
    }
    if (delete_sort) {
      const deleteSorts: Sort[] = Object.values(delete_sort);
      this.addQuerySort(deleteQuery, deleteSorts);
    }
    if (delete_limit) {
      deleteQuery = deleteQuery.limit(Number(delete_limit));
    }
    const res = await deleteQuery;
    return res;
  }

  async countRows(queryOptions: QueryOptions, supabaseClient: SupabaseClientType): Promise<Response> {
    const { count_table_name, count_filters } = queryOptions;
    const countQuery = supabaseClient.from(count_table_name).select('count', { count: 'exact' });
    if (count_filters) {
      const countFiltersData: Filter[] = Object.values(count_filters);
      this.addQueryFilters(countQuery, countFiltersData);
    }
    const res = await countQuery;
    return res;
  }

  addQueryFilters<Q extends PostgrestFilterBuilder<any, any, any, any, any, any, any>>(query: Q, filters: Filter[]): Q {
    filters.forEach(({ operator, column, value }) => {
      switch (operator) {
        case '==':
          query.eq(column, value);
          break;
        case '!=':
          query.neq(column, value);
          break;
        case '<':
          query.lt(column, value);
          break;
        case '>':
          query.gt(column, value);
          break;
        case '<=':
          query.lte(column, value);
          break;
        case '>=':
          query.gte(column, value);
          break;
        case 'is':
          query.is(column, value);
          break;
        case 'in':
          query.in(column, JSON.parse(value));
          break;
        case 'is not':
          query.not(column, 'is', value);
          break;
      }
    });
    return query;
  }

  addQuerySort<Q extends PostgrestFilterBuilder<any, any, any, any, any, any, any>>(query: Q, sorts: Sort[]): Q {
    sorts.forEach(({ column, order }) => {
      query.order(column, { ascending: order === 'ascend' });
    });

    return query;
  }

  getConnectionType(sourceOptions: SourceOptions): ConnectionType {
    return sourceOptions.connection_type || 'secret_key';
  }

  getApiKey(sourceOptions: SourceOptions): string {
    return this.getConnectionType(sourceOptions) === 'publishable_key'
      ? sourceOptions.publishable_key
      : sourceOptions.service_role_secret;
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<SupabaseClientType> {
    const { project_url } = sourceOptions;
    const supabaseClient = createClient(project_url, this.getApiKey(sourceOptions));

    return supabaseClient;
  }

  async runSqlQuery(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string
  ): Promise<QueryResult> {
    const { query, query_params } = queryOptions;

    try {
      if (!query || !query.trim()) throw new Error('Query is empty');

      const knexInstance = await this.getSqlConnection(sourceOptions, dataSourceId, dataSourceUpdatedAt);
      const params: Record<string, any> = Object.fromEntries((query_params || []).filter(([key]) => !!key));

      // knex.raw would treat ':' and '?' in the SQL text as bindings, so only use it when parameters are supplied.
      if (Object.keys(params).length) {
        const { rows } = await knexInstance.raw(query, params);
        return { status: 'ok', data: rows };
      }

      const pool = (knexInstance.client as any).pool;
      const connection = await pool.acquire().promise;
      try {
        const result = await connection.query(query);
        return { status: 'ok', data: result.rows };
      } finally {
        pool.release(connection);
      }
    } catch (err) {
      const { code, detail, hint, routine } = (err || {}) as any;
      throw new QueryError('Query could not be completed', err?.message || 'An unknown error occurred', {
        code: code || null,
        detail: detail || null,
        hint: hint || null,
        routine: routine || null,
      });
    }
  }

  async getSqlConnection(
    sourceOptions: SourceOptions,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Knex> {
    if (!dataSourceId) return this.buildSqlConnection(sourceOptions);

    const enhancedCacheKey = `${dataSourceId}_${generateSourceOptionsHash(sourceOptions)}`;
    const cachedConnection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);
    if (cachedConnection) return cachedConnection;

    const connection = this.buildSqlConnection(sourceOptions);
    cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
    return connection;
  }

  buildSqlConnection(sourceOptions: SourceOptions): Knex {
    const { connection_string, ca_cert } = sourceOptions;
    if (!connection_string) throw new Error('Connection string is required');

    let url: URL;
    try {
      url = new URL(connection_string);
    } catch (_err) {
      throw new Error(
        'Invalid connection string. Expected postgresql://user:password@host:port/database (URL-encode special characters in the password)'
      );
    }

    // The sslmode in the URL is applied here instead of by pg: pg would verify the certificate chain for
    // sslmode=require, which fails against Supabase's private CA unless the CA certificate is supplied.
    const sslmode = url.searchParams.get('sslmode') || url.searchParams.get('ssl') || '';
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    const ssl = ['disable', 'false'].includes(sslmode)
      ? false
      : ca_cert
      ? { rejectUnauthorized: true, ca: ca_cert }
      : { rejectUnauthorized: false };

    const statementTimeout = Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT);

    return knex({
      client: 'pg',
      connection: {
        connectionString: url.toString(),
        ssl,
        statement_timeout: !isNaN(statementTimeout) && statementTimeout > 0 ? statementTimeout : 120000,
      },
      pool: { min: 0, max: 5, acquireTimeoutMillis: 10000 },
      acquireConnectionTimeout: 60000,
    });
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const connectionType = this.getConnectionType(sourceOptions);

    try {
      if (connectionType === 'connection_string') {
        const knexInstance = this.buildSqlConnection(sourceOptions);
        try {
          await knexInstance.raw('SELECT 1');
        } finally {
          await knexInstance.destroy();
        }
        return { status: 'ok' };
      }

      const { project_url } = sourceOptions;
      const apiKey = this.getApiKey(sourceOptions);
      if (!project_url) throw new Error('Project URL is required');
      if (!apiKey) throw new Error(connectionType === 'publishable_key' ? 'Publishable key is required' : 'Secret key is required');

      // supabase-js rejects an empty table name, so ping the PostgREST root directly.
      // The key goes in `apikey` only: the new sb_* keys are not JWTs and must not be sent as a Bearer token.
      const res = await fetch(`${project_url.replace(/\/+$/, '')}/rest/v1/`, { headers: { apikey: apiKey } });
      if (!res.ok) {
        const body: any = await res.json().catch(() => ({}));
        const message: string = body?.message || body?.hint || `Request failed with status ${res.status}`;
        // The schema root is restricted to secret keys: a publishable key that is recognised but refused there is valid.
        const keyAccepted =
          connectionType === 'publishable_key' &&
          [401, 403].includes(res.status) &&
          /schema|secret/i.test(message) &&
          !/invalid|no api key/i.test(message);
        if (!keyAccepted) throw new Error(message);
      }

      return { status: 'ok' };
    } catch (error) {
      throw new QueryError('Connection test failed', error.message, {});
    }
  }
}
