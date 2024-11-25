import { Knex, knex } from 'knex';
import {
  ConnectionTestResult,
  QueryError,
  QueryResult,
  QueryService,
  cacheConnection,
  getCachedConnection,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { isEmpty } from '@tooljet-plugins/common';

const STATEMENT_TIMEOUT = 10000;

export default class MssqlQueryService implements QueryService {
  private static _instance: MssqlQueryService;

  constructor() {
    if (MssqlQueryService._instance) {
      return MssqlQueryService._instance;
    }

    MssqlQueryService._instance = this;
    return MssqlQueryService._instance;
  }

  connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions?.connection_options || []).filter((o) => {
      return o.some((e) => !isEmpty(e));
    });

    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );

    return connectionOptions;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    try {
      const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

      switch (queryOptions.mode) {
        case 'sql':
          return await this.handleRawQuery(knexInstance, queryOptions);
        case 'gui':
          return await this.handleGuiQuery(knexInstance, queryOptions);
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      throw new QueryError(
        'Query could not be completed',
        err instanceof Error ? err.message : 'An unknown error occurred',
        {}
      );
    }
  }

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<any> {
    if (queryOptions.operation !== 'bulk_update_pkey') {
      return { rows: [] };
    }

    const query = this.buildBulkUpdateQuery(queryOptions);
    return await this.executeQuery(knexInstance, query);
  }

  private async handleRawQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { query, query_params } = queryOptions;
    const queryParams = query_params || [];
    const sanitizedQueryParams: Record<string, any> = Object.fromEntries(queryParams.filter(([key]) => !isEmpty(key)));
    const result = await this.executeQuery(knexInstance, query, sanitizedQueryParams);

    return { status: 'ok', data: result };
  }

  private async executeQuery(knexInstance: Knex, query: string, sanitizedQueryParams: Record<string, any> = {}) {
    if (isEmpty(query)) throw new Error('Query is empty');

    const result = await knexInstance.raw(query, sanitizedQueryParams).timeout(STATEMENT_TIMEOUT);
    return result;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('select @@version;').timeout(STATEMENT_TIMEOUT);
    knexInstance.destroy();

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    const config: Knex.Config = {
      client: 'mssql',
      connection: {
        host: sourceOptions.host,
        user: sourceOptions.username,
        password: sourceOptions.password,
        database: sourceOptions.database,
        port: +sourceOptions.port,
        options: {
          encrypt: sourceOptions.azure ?? false,
          instanceName: sourceOptions.instanceName,
        },
        pool: { min: 0 },
      },
      ...this.connectionOptions(sourceOptions),
    };

    return knex(config);
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Knex> {
    if (checkCache) {
      let connection = await getCachedConnection(dataSourceId, dataSourceUpdatedAt);

      if (connection) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions);
        dataSourceId && cacheConnection(dataSourceId, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions);
    }
  }

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const { table, primary_key_column, records } = queryOptions;

    for (const record of records) {
      const primaryKeyValue =
        typeof record[primary_key_column] === 'string' ? `'${record[primary_key_column]}'` : record[primary_key_column];

      queryText = `${queryText} UPDATE ${table} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primary_key_column) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primary_key_column} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
}
