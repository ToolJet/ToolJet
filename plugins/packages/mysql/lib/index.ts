import knex, { Knex } from 'knex';
import {
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  ConnectionTestResult,
  QueryService,
  QueryResult,
  QueryError,
  User,
  App,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { isEmpty } from '@tooljet-plugins/common';
import { Client } from 'ssh2';

function createSSHStream(
  sourceOptions: SourceOptions
): Promise<{ client: Client; stream: NodeJS.ReadWriteStream }> {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();

    sshClient.on('ready', () => {
      sshClient.forwardOut(
        '127.0.0.1', 
        0,          
        sourceOptions.host,        
        Number(sourceOptions.port),
        (err, stream) => {
          if (err) {
            sshClient.end();
            return reject(err);
          }
          stream.on('error', (streamErr) => {
            console.error('SSH stream error (suppressed):', streamErr.message);
          });

          stream.on('close', () => {
            setImmediate(() => {
              try {
                if (sshClient) {
                  sshClient.destroy(); 
                }
              } catch (e) {
                console.error('Error closing SSH client (suppressed):', e.message);
              }
            });
          });

          resolve({ client: sshClient, stream });
        }
      );
    });

    sshClient.on('error', (err) => {
      reject(err);
    });

    sshClient.on('end', () => {
        console.log('SSH connection ended');
      });

   sshClient.on('close', () => {
        console.log('SSH connection closed');
      });

 
    sshClient.connect({
      host: sourceOptions.ssh_host,
      port: sourceOptions.ssh_port || 22,
      username: sourceOptions.ssh_username,
      ...(sourceOptions.ssh_auth_type === 'password'
        ? { password: sourceOptions.ssh_password }
        : {
            privateKey: sourceOptions.ssh_private_key,
            passphrase: sourceOptions.ssh_passphrase,
          }),
      readyTimeout: 20000,
      keepaliveInterval: 10000,
    });
  });
}

export default class MysqlQueryService implements QueryService {
  private static _instance: MysqlQueryService;
  private STATEMENT_TIMEOUT;

  constructor() {
    this.STATEMENT_TIMEOUT =
      process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT && !isNaN(Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT))
        ? Number(process.env.PLUGINS_SQL_DB_STATEMENT_TIMEOUT)
        : 120000;

    if (MysqlQueryService._instance) {
      return MysqlQueryService._instance;
    }
    MysqlQueryService._instance = this;
    return MysqlQueryService._instance;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let checkCache, knexInstance;
    if (sourceOptions['allow_dynamic_connection_parameters']) {
      if (sourceOptions.connection_type === 'hostname') {
        sourceOptions['host'] = queryOptions['host'] ? queryOptions['host'] : sourceOptions['host'];
        sourceOptions['database'] = queryOptions['database'] ? queryOptions['database'] : sourceOptions['database'];
      } else if (sourceOptions.connection_type === 'socket_path') {
        sourceOptions['database'] = queryOptions['database'] ? queryOptions['database'] : sourceOptions['database'];
      }
    }

    try {
      // If dynamic connection parameters is toggled on - We don't cache the connection also destroy the connection created.
      checkCache = sourceOptions['allow_dynamic_connection_parameters'] ? false : true;
      knexInstance = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);

      switch (queryOptions.mode) {
        case 'sql':
          return await this.handleRawQuery(knexInstance, queryOptions);
        case 'gui':
          return await this.handleGuiQuery(knexInstance, queryOptions);
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      const errorMessage = err?.message || 'An unknown error occurred';
      const errorDetails: any = {};

      if (err instanceof Error) {
        const mysqlError = err as any;
        const { code, errno, sqlMessage, sqlState } = mysqlError;

        errorDetails.code = code || null;
        errorDetails.errno = errno || null;
        errorDetails.sqlMessage = sqlMessage || null;
        errorDetails.sqlState = sqlState || null;
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    } finally {
      if (!checkCache) await knexInstance.destroy();
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    let knexInstance;
    try {
      knexInstance = await this.getConnection(sourceOptions, {}, false);
      await knexInstance.raw('select @@version;').timeout(this.STATEMENT_TIMEOUT);
      if (knexInstance) {
          try { await knexInstance.destroy(); } catch (_) {}
      }
      return { status: 'ok' };
    } catch (err) {
      const errorMessage = err?.message || 'An unknown error occurred';
      const errorDetails: any = {};

      if (err instanceof Error) {
        const mysqlError = err as any;
        const { code, errno, sqlMessage, sqlState } = mysqlError;

        errorDetails.code = code || null;
        errorDetails.errno = errno || null;
        errorDetails.sqlMessage = sqlMessage || null;
        errorDetails.sqlState = sqlState || null;
      }

      throw new QueryError('Connection test failed', errorMessage, errorDetails);
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

    return { status: 'ok', data: result[0] };
  }

  private async executeQuery(knexInstance: Knex, query: string, sanitizedQueryParams: Record<string, any> = {}) {
    if (isEmpty(query)) throw new Error('Query is empty');

    const result = await knexInstance.raw(query, sanitizedQueryParams).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  private connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions?.connection_options || []).filter((o) => o.some((e) => !isEmpty(e)));
    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );
    return connectionOptions;
  }



  private parseConnectionString(connectionString: string): Partial<SourceOptions> {
    const parsed: Partial<SourceOptions & { params?: Record<string, string>; socketPath?: string }> = {};

    if (!connectionString) return parsed;

    const trimmed = connectionString.trim();

    try {
      const url = new URL(trimmed);
      if (url.protocol && url.protocol.startsWith('mysql')) {
        if (url.username) parsed.username = decodeURIComponent(url.username);
        if (url.password) parsed.password = decodeURIComponent(url.password);
        if (url.hostname) parsed.host = decodeURIComponent(url.hostname);

        if (url.port) {
          const p = parseInt(url.port, 10);
          if (!isNaN(p)) parsed.port = String(p);
        }

        if (url.pathname && url.pathname !== '/') {
          parsed.database = decodeURIComponent(url.pathname.slice(1));
        }

        const queryParams: Record<string, string> = {};
        url.searchParams.forEach((v, k) => {
          queryParams[k] = v;
        });

        if (Object.keys(queryParams).length) {
          parsed.params = queryParams;
        }

        const socket = url.searchParams.get('socket') || url.searchParams.get('socketPath');
        if (socket) parsed.socket_path = socket;
        const sslParam = url.searchParams.get('ssl')
          || url.searchParams.get('sslmode')
          || url.searchParams.get('ssl_mode');
        if (sslParam !== null) {
          parsed.ssl_enabled = ['true', '1', 'require', 'required', 'verify-ca', 'verify-full']
            .includes(sslParam.toLowerCase()) as any;
        }

        return parsed;
      }
    } catch (_) {}

    const regex =
      /^mysql:\/\/(?:([^:@\/?#]+)(?::([^@\/?#]*))?@)?(\[[^\]]+\]|[^:\/?#]+)?(?::(\d+))?(?:\/([^?]*))?(?:\?(.*))?$/;

    const m = trimmed.match(regex);

    if (m) {
      const user = m[1];
      const pass = m[2];
      const hostRaw = m[3];
      const portRaw = m[4];
      const db = m[5];
      const query = m[6];

      if (user) {
        try { parsed.username = decodeURIComponent(user); } catch { parsed.username = user; }
      }
      if (pass !== undefined) {
        try { parsed.password = decodeURIComponent(pass); } catch { parsed.password = pass; }
      }

      if (hostRaw) {
        let host = hostRaw;
        if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
        try { parsed.host = decodeURIComponent(host); } catch { parsed.host = host; }
      }

      if (portRaw) {
        const p = parseInt(portRaw, 10);
        if (!isNaN(p)) parsed.port = String(p);
      }

      if (db) {
        try { parsed.database = decodeURIComponent(db); } catch { parsed.database = db; }
      }

      if (query) {
        const q: Record<string, string> = {};
        query.split('&').forEach(part => {
          if (!part) return;
          const idx = part.indexOf('=');
          if (idx === -1) {
            q[decodeURIComponent(part)] = '';
          } else {
            const k = part.slice(0, idx);
            const v = part.slice(idx + 1);
            try { q[decodeURIComponent(k)] = decodeURIComponent(v); } catch { q[k] = v; }
          }
        });

        if (Object.keys(q).length) parsed.params = q;
        if (q['socket'] || q['socketPath']) {
          parsed.socket_path = q['socket'] || q['socketPath'];
          const sslMode = q['ssl'] || q['sslmode'] || q['ssl_mode'];
          if (sslMode !== undefined) {
            parsed.ssl_enabled = ['true', '1', 'require', 'required', 'verify-ca', 'verify-full']
              .includes(sslMode.toLowerCase()) as any;
          }
        }
      }

      return parsed;
    }

    // Strategy 3: Key-value pair parsing (Server=host;Port=3306;...)
    // Uses join('=') to correctly handle values that contain '=' characters
    const pairs = trimmed.split(';').filter(p => p.trim());

    pairs.forEach(pair => {
      if (!pair.includes('=')) return;

      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=').trim();
      const lowerKey = key.trim().toLowerCase();

      if (lowerKey === 'server' || lowerKey === 'host') {
        parsed.host = value;
      } else if (lowerKey === 'port') {
        const p = parseInt(value, 10);
        if (!isNaN(p)) parsed.port = String(p);
      } else if (lowerKey === 'database' || lowerKey === 'db') {
        parsed.database = value;
      } else if (lowerKey === 'uid' || lowerKey === 'user' || lowerKey === 'username') {
        parsed.username = value;
      } else if (lowerKey === 'pwd' || lowerKey === 'password') {
        parsed.password = value;
      } else if (lowerKey === 'socket' || lowerKey === 'socketpath') {
        parsed.socket_path = value;
      }else if (lowerKey === 'ssl' || lowerKey === 'sslmode' || lowerKey === 'ssl_mode' || lowerKey === 'usessl') {
        const v = value.toLowerCase();
        parsed.ssl_enabled = ['true', '1', 'require', 'required', 'verify-ca', 'verify-full']
          .includes(v) as any;
      } else {
        if (!parsed.params) parsed.params = {};
        parsed.params[key.trim()] = value;
      }
    });

    return parsed;
  }

  

  private async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
  let effectiveOptions = { ...sourceOptions };
  if (sourceOptions.connection_type === 'string' && sourceOptions.connection_string) {
    const parsed = this.parseConnectionString(sourceOptions.connection_string);
      effectiveOptions.host= effectiveOptions.host || parsed.host;
      effectiveOptions.port= effectiveOptions.port|| parsed.port;
      effectiveOptions.database=effectiveOptions.database || parsed.database;
      effectiveOptions.username=effectiveOptions.username || parsed.username;
      effectiveOptions.password=effectiveOptions.password || parsed.password;
      if (parsed.socket_path) effectiveOptions.socket_path =effectiveOptions.socket_path ||  parsed.socket_path;
      if (parsed.ssl_enabled !== undefined) effectiveOptions.ssl_enabled = effectiveOptions.ssl_enabled || parsed.ssl_enabled;
  }

  const shouldUseSSL = effectiveOptions.ssl_enabled;
  let sslObject: any = null;

  if (shouldUseSSL) {
    sslObject = { rejectUnauthorized: (effectiveOptions.ssl_certificate ?? 'none') !== 'none' };
    
    if (effectiveOptions.ssl_certificate === 'ca_certificate') {
      sslObject.ca = effectiveOptions.ca_cert;
      sslObject.key = effectiveOptions.client_key;
      sslObject.cert = effectiveOptions.client_cert;
    } else if (effectiveOptions.ssl_certificate === 'self_signed') {
      sslObject.ca = effectiveOptions.root_cert;
      sslObject.key = effectiveOptions.client_key;
      sslObject.cert = effectiveOptions.client_cert;
    }
  }
  let connectionConfig: any ;
  if (effectiveOptions.ssh_enabled=='enabled') {
    connectionConfig = async () => {
      const ssh = await createSSHStream(effectiveOptions);
      return {
        stream: ssh.stream,
        user: effectiveOptions.username,
        password: effectiveOptions.password,
        database: effectiveOptions.database,
        multipleStatements: true,
        ...(shouldUseSSL ? { ssl: sslObject } : {}),
      };
    };
  }else{
     connectionConfig = {
      user: effectiveOptions.username,
      password: effectiveOptions.password,
      database: effectiveOptions.database,
      multipleStatements: true,
      ...(shouldUseSSL ? { ssl: sslObject } : {}),
    };
    
    if (effectiveOptions.socket_path) {
      connectionConfig.socketPath = effectiveOptions.socket_path;
    }else{
      connectionConfig.host = effectiveOptions.host;
      connectionConfig.port =  Number(effectiveOptions.port);
    }
  }

  const config: Knex.Config = {
    client: 'mysql2',
    connection: connectionConfig,
    ...this.connectionOptions(effectiveOptions),
  };

  const knexInstance = knex(config);

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
      const cachedConnection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);
      if (cachedConnection) return cachedConnection;

      const connection = await this.buildConnection(sourceOptions);
      cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
      return connection;
    }

    return await this.buildConnection(sourceOptions);
  }

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const { table: tableName, primary_key_column: primaryKey, records } = queryOptions;

    for (const record of records) {
      const primaryKeyValue = typeof record[primaryKey] === 'string' ? `'${record[primaryKey]}'` : record[primaryKey];

      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
  async listTables(
      sourceOptions: SourceOptions,
    ): Promise<QueryResult> {
      let knexInstance;
      try {
        knexInstance = await this.buildConnection(sourceOptions);
        
        const result = await knexInstance.raw(`SHOW TABLES`);
  
        const rows = result[0] || [];
    
        const tables = rows.map((row: any) => {
          const tableName = Object.values(row)[0] as string;
          return {
            key: tableName,
            value: tableName,
            label: tableName,
          };
        });
  
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
          `Method ${methodName} is not supported for MySQL plugin`, 
          {
            availableMethods: ['getTables'],
          }
        );
      } catch (err) {
        if (err instanceof QueryError) {
          throw err;
        }

        const errorMessage = err?.message || 'An unknown error occurred';
        const errorDetails: any = {};

        if (err instanceof Error) {
          const mysqlError = err as any;
          const { code, errno, sqlMessage, sqlState } = mysqlError;

          errorDetails.code = code || null;
          errorDetails.errno = errno || null;
          errorDetails.sqlMessage = sqlMessage || null;
          errorDetails.sqlState = sqlState || null;
        }

        throw new QueryError('Method invocation failed', errorMessage, errorDetails);
      }
    }
}
