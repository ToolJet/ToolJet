import { Knex, knex } from 'knex';
import oracledb from 'oracledb';
import {
  cacheConnection,
  getCachedConnection,
  ConnectionTestResult,
  QueryService,
  QueryResult,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class OracledbQueryService implements QueryService {
  private static _instance: OracledbQueryService;

  constructor() {
    if (OracledbQueryService._instance) {
      return OracledbQueryService._instance;
    }

    OracledbQueryService._instance = this;
    return OracledbQueryService._instance;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let result = {
      rows: [],
    };
    let query = '';

    if (queryOptions.mode === 'gui') {
      if (queryOptions.operation === 'bulk_update_pkey') {
        query = await this.buildBulkUpdateQuery(queryOptions);
      }
    } else {
      query = queryOptions.query;
    }

    const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    // eslint-disable-next-line no-useless-catch
    try {
      result = await knexInstance.raw(query);

      return {
        status: 'ok',
        data: result,
      };
    } catch (err) {
      throw err;
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await knexInstance.raw('SELECT * FROM v$version');

    return {
      status: 'ok',
    };
  }

  initOracleClient(clientPathType: string, customPath: string) {
    try {
      if (clientPathType === 'custom') {
        if (process.platform === 'darwin') {
          oracledb.initOracleClient({ libDir: process.env.HOME + customPath });
        } else if (process.platform === 'win32') {
          oracledb.initOracleClient({
            libDir: customPath,
          }); // note the double backslashes
        }
      } else {
        oracledb.initOracleClient();
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async buildConnection(sourceOptions: SourceOptions) {
    // we should add this to our datasource documentation
    try {
      oracledb.oracleClientVersion;
    } catch (err) {
      console.log('Oracle client is not initailized');
      this.initOracleClient(sourceOptions.client_path_type, sourceOptions.path);
    }

    const config: Knex.Config = {
      client: 'oracledb',
      connection: {
        user: sourceOptions.username,
        password: sourceOptions.password,
        connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${sourceOptions.host})(PORT=${sourceOptions.port}))(CONNECT_DATA=(SERVER=DEDICATED)(${sourceOptions.database_type}=${sourceOptions.database})))`,
        multipleStatements: true,
        ssl: sourceOptions.ssl_enabled, // Disabling by default for backward compatibility
      },
    };

    return knex(config);
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<any> {
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

  async buildBulkUpdateQuery(queryOptions: any): Promise<string> {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];

    for (const record of records) {
      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `begin ${queryText} WHERE ${primaryKey} = ${record[primaryKey]}; end;`;
    }

    return queryText.trim();
  }
}
