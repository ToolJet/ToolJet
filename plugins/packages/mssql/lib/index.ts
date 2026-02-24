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
      process.on('uncaughtException', (err: any) => {
        if (err?.code === 'ESOCKET') return;
        throw err;
      });
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
      try { await knexInstance.destroy(); } catch (_) {};
      return {
        status: 'ok',
      };
    } catch (err: any) {
      let message = 'Connection test failed';
      let details: any = {};

      if (err?.code || err?.number || err?.serverName) {
        message = err.message;
        details = {
          code: err.code ?? null,
          severity: err.severity ?? null,
          state: err.state ?? null,
          number: err.number ?? null,
          lineNumber: err.lineNumber ?? null,
          serverName: err.serverName ?? null,
          class: err.class ?? null,
        };
      }
      else if (err?.code === 'ESOCKET' || err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT') {
        message = `Network error: ${err.message}`;
      }
      else if (err?.code === 'ELOGIN') {
        message = `Authentication failed: ${err.message}`;
      }
      else if (err?.message?.includes('SSH')) {
        message = `SSH connection failed: ${err.message}`;
      }
      else if (err?.name === 'KnexTimeoutError') {
        message = 'Database connection timeout. Please check host/port/firewall';
      }
      else if (err?.message) {
        message = err.message;
      }

      throw new QueryError('Connection test failed', message, details);
    } finally {
      if (knexInstance) {
        try { await knexInstance.destroy(); } catch (_) {}
      }
    }
  }

private parseConnectionString(connectionString: string): Partial<SourceOptions> {
  const parsed: Partial<SourceOptions> = {};

  if (!connectionString) return parsed;

  const trimmed = connectionString.trim();

  const withoutScheme = /^sqlserver:\/\//i.test(trimmed)
    ? trimmed.replace(/^sqlserver:\/\//i, '')
    : trimmed;

  const looksLikeHybrid = withoutScheme.includes(';') &&
    !/^[a-z ]+=/i.test(withoutScheme.split(';')[0]);

  if (looksLikeHybrid) {
    const firstSemi = withoutScheme.indexOf(';');
    const hostSegment = withoutScheme.slice(0, firstSemi);
    const rest = withoutScheme.slice(firstSemi + 1);

    const hostMatch = hostSegment.match(/^([^:\\,]+)(?::(\d+))?(?:\\([^,]*))?(?:,(\d+))?/);
    if (hostMatch) {
      if (hostMatch[1]) parsed.host = hostMatch[1].trim();
      if (hostMatch[2]) parsed.port = (parseInt(hostMatch[2], 10));
      if (hostMatch[3]) parsed.instanceName = hostMatch[3].trim();
      if (hostMatch[4]) parsed.port = (parseInt(hostMatch[4], 10));
    }

    rest.split(';').forEach(pair => {
      if (!pair.includes('=')) return;
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=').trim();
      const lowerKey = key.trim().toLowerCase();

      if (lowerKey === 'database' || lowerKey === 'initial catalog') {
        parsed.database = value;
      } else if (lowerKey === 'user id' || lowerKey === 'uid' || lowerKey === 'user') {
        parsed.username = value;
      } else if (lowerKey === 'password' || lowerKey === 'pwd') {
        parsed.password = value;
      } else if (lowerKey === 'encrypt') {
        parsed.azure = ['true', '1', 'yes'].includes(value.toLowerCase()) as any;
      } else if (lowerKey === 'port') {
        parsed.port = (parseInt(value, 10));
      } else if (lowerKey === 'instance' || lowerKey === 'instance name') {
        parsed.instanceName = value;
      }
    });
  }

  return parsed;
}

  async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    let finalOptions: SourceOptions;
    
    if (sourceOptions.connection_type === 'string') {
      const parsedOptions = this.parseConnectionString(sourceOptions.connection_string || '');
      

       finalOptions = { ...sourceOptions };
        if (parsedOptions.host) finalOptions.host= finalOptions.host || parsedOptions.host;
        if (parsedOptions.port) finalOptions.port=finalOptions.port || parsedOptions.port;
        if (parsedOptions.database) finalOptions.database=finalOptions.database || parsedOptions.database;
        if (parsedOptions.username) finalOptions.username=finalOptions.username || parsedOptions.username;
        if (parsedOptions.password) finalOptions.password=finalOptions.password || parsedOptions.password;
        if (parsedOptions.instanceName) finalOptions.instanceName =finalOptions.instanceName|| parsedOptions.instanceName;
        if (parsedOptions.azure !== undefined) finalOptions.azure=finalOptions.azure|| parsedOptions.azure;

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
      },
      pool: {
        min: 0,
        afterCreate: (conn: any, done: (err: Error | null, conn: any) => void) => {
          conn.on('error', (_err: Error) => {});
          done(null, conn);
        },
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
