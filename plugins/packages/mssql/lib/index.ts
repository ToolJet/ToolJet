import { Knex, knex } from 'knex';
import {
  ConnectionTestResult,
  QueryError,
  QueryResult,
  QueryService,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
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
      const checkCache = !sourceOptions.ssh_enabled;
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
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
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('select @@version;').timeout(this.STATEMENT_TIMEOUT);
    knexInstance.destroy();

    return {
      status: 'ok',
    };
  }

  async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
  let tunnel: SSHTunnel | null = null;

  let host: string;
  let port: number;

  if (sourceOptions.ssh_enabled) {
    tunnel = await createSSHTunnel(sourceOptions);
    host = '127.0.0.1';
    port = tunnel.localPort;
  } else {
    host = sourceOptions.host;
    port = +sourceOptions.port;
  }

  const config: Knex.Config = {
    client: 'mssql',
    connection: {
      host,
      port,
      user: sourceOptions.username,
      password: sourceOptions.password,
      database: sourceOptions.database,
      options: {
        encrypt: sourceOptions.azure ?? false,
        instanceName: sourceOptions.instanceName,
        ...(sourceOptions.connection_options &&
          this.sanitizeOptions(sourceOptions.connection_options)),
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
}
