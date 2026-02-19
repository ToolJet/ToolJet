import { Knex, knex } from 'knex';
import {
  ConnectionTestResult,
  QueryError,
  QueryResult,
  QueryService,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  User,
  App,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { isEmpty } from '@tooljet-plugins/common';
import { Client } from 'ssh2';
import net from 'net';

interface SSHTunnel {
  client: Client;
  server: net.Server;
  localPort: number;
}

const recognizedBooleans = {
  true: true,
  false: false,
};

function interpretValue(value: string): string | boolean | number {
  return recognizedBooleans[value.toLowerCase()] ?? (!isNaN(Number.parseInt(value)) ? Number.parseInt(value) : value);
}

function createSSHTunnel(sourceOptions: SourceOptions): Promise<SSHTunnel> {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();

    sshClient.on('ready', () => {
      const server = net.createServer(socket => {
        sshClient.forwardOut(
          socket.remoteAddress || '127.0.0.1',
          socket.remotePort || 0,
          sourceOptions.host,           
          Number(sourceOptions.port),   
          (err, stream) => {
            if (err) {
              socket.destroy();
              return;
            }
            socket.pipe(stream);
            stream.pipe(socket);
          }
        );
      });

      server.on('error', err => {
        sshClient.end();
        reject(err);
      });

      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as net.AddressInfo;
        resolve({ client: sshClient, server, localPort: port });
      });
    });

    sshClient.on('error', reject);

    sshClient.connect({
      host: sourceOptions.ssh_host,
      port: sourceOptions.ssh_port || 22,
      username: sourceOptions.ssh_username,
      readyTimeout: 20000,
      keepaliveInterval: 10000,
      ...(sourceOptions.ssh_auth_type === 'password'
        ? { password: sourceOptions.ssh_password }
        : {
            privateKey: sourceOptions.ssh_private_key,
            ...(sourceOptions.ssh_passphrase
              ? { passphrase: sourceOptions.ssh_passphrase }
              : {}),
          }),
    });

  });
}

export default class MssqlQueryService implements QueryService {
  private static _instance: MssqlQueryService;
  private STATEMENT_TIMEOUT;

  constructor() {
    this.STATEMENT_TIMEOUT =
      process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT && !isNaN(Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT))
        ? Number(process.env.PLUGINS_SQL_DB_STATEMENT_TIMEOUT)
        : 120000;

    if (!MssqlQueryService._instance) {
      MssqlQueryService._instance = this;
    }
    return MssqlQueryService._instance;
  }

  sanitizeOptions(options: string[][]) {
    const _connectionOptions = (options || [])
      .filter((o) => o.every((e) => !!e))
      .map(([key, value]) => [key, interpretValue(value)]);

    return Object.fromEntries(_connectionOptions);
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    try {
      const checkCache = sourceOptions.ssh_enabled=='disabled';
      const knexInstance = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);

      switch (queryOptions.mode) {
        case 'sql':
          return await this.handleRawQuery(knexInstance, queryOptions);
        case 'gui':
          return await this.handleGuiQuery(knexInstance, queryOptions);
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      const errorDetails: any = {};

      if (err && err instanceof Error) {
        const msSqlError = err as any;
        const { code, severity, state, number, lineNumber, serverName, class: errorClass } = msSqlError;
        errorDetails.code = code || null;
        errorDetails.severity = severity || null;
        errorDetails.state = state || null;
        errorDetails.number = number || null;
        errorDetails.lineNumber = lineNumber || null;
        errorDetails.serverName = serverName || null;
        errorDetails.class = errorClass || null;
      }
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
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

    const result = await knexInstance.raw(query, sanitizedQueryParams).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    let knexInstance;
    try {
      knexInstance = await this.getConnection(sourceOptions, {}, false);
      await knexInstance.raw('select @@version;').timeout(this.STATEMENT_TIMEOUT);

      return {
        status: 'ok',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      const errorDetails: any = {};

      if (err && err instanceof Error) {
        const msSqlError = err as any;
        const { code, severity, state, number, lineNumber, serverName, class: errorClass } = msSqlError;
        errorDetails.code = code || null;
        errorDetails.severity = severity || null;
        errorDetails.state = state || null;
        errorDetails.number = number || null;
        errorDetails.lineNumber = lineNumber || null;
        errorDetails.serverName = serverName || null;
        errorDetails.class = errorClass || null;
      }
      throw new QueryError('Connection test failed', errorMessage, errorDetails);
    } finally {
      if (knexInstance) {
        await knexInstance.destroy();
      }
    }
  }

  private parseConnectionString(connStr: string): Partial<SourceOptions> {
    const params: Partial<SourceOptions> = {};
    
    const pairs = connStr.split(';').filter(p => p.trim());
    
    pairs.forEach(pair => {
      if (!pair.includes('=')) return;
      
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      const lowerKey = key.trim().toLowerCase();
       
      if (lowerKey === 'server' || lowerKey === 'data source') {
        const [host, port] = value.trim().split(',');
        params.host = host;
        if (port) params.port = parseInt(port);
      } else if (lowerKey === 'database' || lowerKey === 'initial catalog') {
        params.database = value.trim();
      } else if (lowerKey === 'user id' || lowerKey === 'uid' || lowerKey === 'user') {
        params.username = value.trim();
      } else if (lowerKey === 'password' || lowerKey === 'pwd') {
        params.password = value.trim();
      } else if (lowerKey === 'encrypt') {
        params.azure = value.trim().toLowerCase() === 'true';
      }
    });
    
    return params;
  }

  async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    let finalOptions: SourceOptions;
    
    if (sourceOptions.connection_type === 'string') {
      const parsedOptions = this.parseConnectionString(sourceOptions.connection_string || '');
      
      finalOptions = {
        host:  parsedOptions.host || 'localhost',
        port: parsedOptions.port || 1433,
        database:  parsedOptions.database || '',
        username:  parsedOptions.username || '',
        password:  parsedOptions.password || '',
        azure: sourceOptions.azure !== undefined ? sourceOptions.azure : parsedOptions.azure,
        instanceName: sourceOptions.instanceName || parsedOptions.instanceName,
        connection_options: sourceOptions.connection_options,
        connection_type: sourceOptions.connection_type,
        connection_string: sourceOptions.connection_string,
        ssh_enabled: sourceOptions.ssh_enabled,
        ssh_host: sourceOptions.ssh_host,
        ssh_port: sourceOptions.ssh_port,
        ssh_username: sourceOptions.ssh_username,
        ssh_auth_type: sourceOptions.ssh_auth_type,
        ssh_private_key: sourceOptions.ssh_private_key,
      } as SourceOptions;
    } else {
      finalOptions = sourceOptions;
    }

    let tunnel: SSHTunnel | null = null;

    let host: string;
    let port: number;

    if (sourceOptions.ssh_enabled=='enabled') {
      tunnel = await createSSHTunnel(sourceOptions);
      host = '127.0.0.1';
      port = tunnel.localPort;
    } else {
      host = finalOptions.host;
      port = +finalOptions.port;
    }

    const config: Knex.Config = {
      client: 'mssql',
      connection: {
        host: host,
        user: finalOptions.username,
        password: finalOptions.password,
        database: finalOptions.database,
        port: port,
        options: {
          encrypt: finalOptions.azure ?? false,
          instanceName: finalOptions.instanceName,
          ...(finalOptions.connection_options && this.sanitizeOptions(finalOptions.connection_options)),
        },
        pool: { min: 0 },
      },
    };

    const knexInstance = knex(config);

 
    if (tunnel) {
      const originalDestroy = knexInstance.destroy.bind(knexInstance);
      Object.defineProperty(knexInstance, 'destroy', {
        value: async function () {
          try {
            await originalDestroy();
          } finally {
            tunnel.server.close();
            tunnel.client.end();
          }
        },
      });
    }
    return knexInstance;
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Knex> {
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

  async listTables(
    sourceOptions: SourceOptions
  ): Promise<QueryResult> {
    let knexInstance;
    try {
      knexInstance = await this.buildConnection(sourceOptions);
      
      const result = await knexInstance
        .raw(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          AND TABLE_CATALOG = ?
          ORDER BY TABLE_NAME
        `, [sourceOptions.database])
        .timeout(this.STATEMENT_TIMEOUT);

      const tables = result.map((row: any) => ({
        label: row.TABLE_NAME,
        value: row.TABLE_NAME,
      }));

      return {
        status: 'ok',
        data: tables,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      throw new QueryError('Could not fetch tables', errorMessage, {});
    } finally {
      if (knexInstance) {
        await knexInstance.destroy();
      }
    }
  }

  async invokeMethod(
    methodName: string,
    context: { user?: User; app?: App },
    sourceOptions: SourceOptions,
    args?: any
  ): Promise<any> {
    try {
      if (methodName === 'getTables') {
        return await this.listTables(sourceOptions);
      }
      throw new QueryError(
        'Method not found', 
        `Method ${methodName} is not supported for MSSQL plugin`, 
        {
          availableMethods: ['getTables'],
        }
      );
    } catch (err) {
      if (err instanceof QueryError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      const errorDetails: any = {};

      if (err && err instanceof Error) {
        const msSqlError = err as any;
        const { code, severity, state, number, lineNumber, serverName, class: errorClass } = msSqlError;
        errorDetails.code = code || null;
        errorDetails.severity = severity || null;
        errorDetails.state = state || null;
        errorDetails.number = number || null;
        errorDetails.lineNumber = lineNumber || null;
        errorDetails.serverName = serverName || null;
        errorDetails.class = errorClass || null;
      }
      throw new QueryError('Method invocation failed', errorMessage, errorDetails);
    }
  }
}
