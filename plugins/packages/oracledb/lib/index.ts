import { Knex, knex } from 'knex';
import oracledb from 'oracledb';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as unzipper from 'unzipper';
import {
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
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

    const queryParams = queryOptions.query_params || [];
    const namedParams = Object.fromEntries(queryParams.filter(([k]) => k !== ''));
    const hasParams = Object.keys(namedParams).length > 0;

    if (sourceOptions.use_tns_alias == 'thin') {
      try {
        const connection: any = await this.buildConnection(sourceOptions);
        result = await connection.execute(query, hasParams ? namedParams : [], {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        await connection.close();
        return {
          status: 'ok',
          data: result.rows,
        };
      } catch (err) {
        throw err;
      }
    }

    const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    // eslint-disable-next-line no-useless-catch
    try {
      result = await knexInstance.raw(query, hasParams ? namedParams : undefined);

      return {
        status: 'ok',
        data: result,
      };
    } catch (err) {
      throw err;
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    if (sourceOptions.use_tns_alias == 'thin') {
      const connection: any = await this.buildConnection(sourceOptions);
      await connection.execute('SELECT * FROM v$version');
      await connection.close();
      return {
        status: 'ok',
      };
    }
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('SELECT * FROM v$version');
    knexInstance.destroy();

    return {
      status: 'ok',
    };
  }

  // If in Windows, you use backslashes in the libDir string, you will
  // need to double them.
  // clientOpts = { libDir: 'C:\\oracle\\instantclient_19_19' };
  // else on other platforms like Linux
  // the system library search path MUST always be
  // set before Node.js is started, for example with ldconfig or LD_LIBRARY_PATH.
  initOracleClient(clientPathType: string, customPath: string, instantClientVersion: string, initOptions: any = {}) {
    try {
      const clientOpts: any = { ...initOptions };

      if (clientPathType === 'custom') {
        clientOpts.libDir = customPath;
      } else if (clientPathType === 'default') {
        clientOpts.libDir = `/opt/oracle/instantclient_${instantClientVersion}`;
      }

      // enable node-oracledb Thick mode
      oracledb.initOracleClient(clientOpts);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async buildConnection(sourceOptions: SourceOptions) {
    try {
      if (sourceOptions.use_tns_alias == 'thin' && sourceOptions.wallet_file) {
        const base64Data = sourceOptions.wallet_file.split(',')[1] || sourceOptions.wallet_file;
        const buffer = Buffer.from(base64Data, 'base64');

        const tempWalletDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oracle-wallet-'));
        const zipPath = path.join(tempWalletDir, 'wallet.zip');

        fs.writeFileSync(zipPath, buffer);
        await fs
          .createReadStream(zipPath)
          .pipe(unzipper.Extract({ path: tempWalletDir }))
          .promise();

        const extractedContents = fs
          .readdirSync(tempWalletDir)
          .filter((f) => f !== 'wallet.zip' && !f.startsWith('__MACOSX'));

        if (
          extractedContents.length === 1 &&
          fs.statSync(path.join(tempWalletDir, extractedContents[0])).isDirectory()
        ) {
          sourceOptions.config_dir = path.join(tempWalletDir, extractedContents[0]);
          sourceOptions.wallet_file_path = sourceOptions.config_dir;
        } else {
          sourceOptions.config_dir = tempWalletDir;
          sourceOptions.wallet_file_path = sourceOptions.config_dir;
        }
      }

      try {
        const initOptions: any = {};

        if (sourceOptions.use_tns_alias == 'thick' && sourceOptions.config_dir) {
          initOptions.configDir = sourceOptions.config_dir;
        }
        if (sourceOptions.use_tns_alias != 'thin')
          this.initOracleClient(
            sourceOptions.client_path_type,
            sourceOptions.path,
            sourceOptions.instant_client_version,
            initOptions
          );
      } catch (err) {
        console.error('Oracle client failed to initialize', err);
        //SKIP THrowing error since oracle node driver caches the request
        //TODO Cache the Oracle client initialization result to avoid repeated initialization attempts
      }

      const connectionConfig: any = {
        user: sourceOptions.username,
        password: sourceOptions.password,
      };
      if (sourceOptions.use_tns_alias == 'thick' || sourceOptions.use_tns_alias == 'thin') {
        connectionConfig.connectString = sourceOptions.tns_alias;

        if (sourceOptions.config_dir) {
          connectionConfig.walletLocation = sourceOptions.wallet_file_path || sourceOptions.config_dir;
          connectionConfig.configDir = sourceOptions.config_dir;
        }
        if (sourceOptions.wallet_password) {
          connectionConfig.walletPassword = sourceOptions.wallet_password;
        }
      } else {
        connectionConfig.connectString = `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${sourceOptions.host})(PORT=${sourceOptions.port}))(CONNECT_DATA=(SERVER=DEDICATED)(${sourceOptions.database_type}=${sourceOptions.database})))`;
        connectionConfig.ssl = sourceOptions.ssl_enabled;
      }

      const config: Knex.Config = {
        client: 'oracledb',
        connection: connectionConfig,
      };
      if (sourceOptions.use_tns_alias == 'thin') {
        const connection = await oracledb.getConnection(connectionConfig);
        return connection;
      }

      return knex(config);
    } catch (err) {
      console.error('Error building OracleDB connection:', err);
      throw err;
    }
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<any> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      let connection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);

      if (connection) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions);
        cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
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
