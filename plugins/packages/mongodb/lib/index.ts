import { QueryResult, QueryService, QueryError, ConnectionTestResult } from '@tooljet-plugins/common';
const { MongoClient } = require('mongodb');
const JSON5 = require('json5');
import { EJSON } from 'bson';
import { SourceOptions, QueryOptions } from './types';
import tls from 'tls';
import { Client as SSHClient } from 'ssh2';
import net from 'net';

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
  const srv = net.createServer();
    srv.unref();
    srv.listen(0, '127.0.0.1', () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on('error', reject);
  });
}

async function createSSHTunnel(sshConfig: {
  host: string;
  port?: number;
  username: string;
  authType: 'password' | 'private_key';
  password?: string;
  privateKey?: string;
  passphrase?: string;
  dstHost: string;
  dstPort: number;
  localPort: number;
}): Promise<{ ssh: SSHClient; server: net.Server }> {
  return new Promise((resolve, reject) => {
    const ssh = new SSHClient();
    let server: net.Server;

    ssh.on('ready', () => {
      server = net.createServer((socket) => {
        ssh.forwardOut('127.0.0.1', 0, sshConfig.dstHost, sshConfig.dstPort, (err, stream) => {
          if (err) {
            socket.destroy();
            return;
          }

          const cleanup = () => {
            if (!socket.destroyed) socket.destroy();
            try { stream.close(); } catch (_) { /* ignore */ }
          };

          stream.on('error', cleanup);
          socket.on('error', cleanup);
          stream.on('close', () => { if (!socket.destroyed) socket.destroy(); });
          socket.on('close', () => { try { stream.close(); } catch (_) { /* ignore */ } });

          socket.pipe(stream).pipe(socket);
        });
      });

      server.on('error', (err) => {
        ssh.end();
        reject(err);
      });

      ssh.on('close', () => { server.close(); });

      server.listen(sshConfig.localPort, '127.0.0.1', () => {
        resolve({ ssh, server });
      });
    });

    ssh.on('error', reject);

    const connectConfig: any = {
      host: sshConfig.host,
      port: sshConfig.port ?? 22,
      username: sshConfig.username,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
      readyTimeout: 20000,
    };

    if (sshConfig.authType === 'password') {
      connectConfig.password = sshConfig.password;
    } else {
      connectConfig.privateKey = sshConfig.privateKey;
      if (sshConfig.passphrase) connectConfig.passphrase = sshConfig.passphrase;
    }

    ssh.connect(connectConfig);
  });
}

function closeSshResources(sshResources: { ssh: SSHClient; server: net.Server } | null): void {
  if (!sshResources) return;
  try { sshResources.server.close(); } catch (_) { /* ignore */ }
  try { sshResources.ssh.end(); } catch (_) { /* ignore */ }
}

function validateSSHOptions(sourceOptions: SourceOptions): void {
  if (sourceOptions.ssh_enabled !== 'enabled') return;
  if (!sourceOptions.ssh_host) {
    throw new QueryError('Invalid SSH config', 'ssh_host is required when SSH is enabled', {});
  }
  if (!sourceOptions.ssh_username) {
    throw new QueryError('Invalid SSH config', 'ssh_username is required when SSH is enabled', {});
  }
  if (!sourceOptions.ssh_auth_type) {
    throw new QueryError('Invalid SSH config', 'ssh_auth_type is required when SSH is enabled', {});
  }
  if (sourceOptions.ssh_auth_type === 'password' && !sourceOptions.ssh_password) {
    throw new QueryError('Invalid SSH config', 'ssh_password is required for password-based SSH auth', {});
  }
  if (sourceOptions.ssh_auth_type === 'private_key' && !sourceOptions.ssh_private_key) {
    throw new QueryError('Invalid SSH config', 'ssh_private_key is required for key-based SSH auth', {});
  }
}

export default class MongodbService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { db, close } = await this.getConnection(sourceOptions);
    let result = {};
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'list_collections':
          result = await db.listCollections().toArray();
          break;
         case 'create_collection':
          const collection = await db.createCollection(queryOptions.collection, this.parseEJSON(queryOptions.options));
          result = {
            collectionName: collection.collectionName,
            namespace: collection.namespace,
            options: collection.options,
          };
          break;
        case 'insert_one':
          result = await db
            .collection(queryOptions.collection)
            .insertOne(this.parseEJSON(queryOptions.document), this.parseEJSON(queryOptions.options));
          break;
        case 'insert_many':
          result = await db
            .collection(queryOptions.collection)
            .insertMany(this.parseEJSON(queryOptions.documents), this.parseEJSON(queryOptions.options));
          break;
        case 'find_one':
          result = await db
            .collection(queryOptions.collection)
            .findOne(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'find_many':
          result = await db
            .collection(queryOptions.collection)
            .find(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options))
            .toArray();
          break;
        case 'count_total':
          result = await db
            .collection(queryOptions.collection)
            .estimatedDocumentCount(this.parseEJSON(queryOptions.options));
          result = { count: result };
          break;
        case 'count':
          result = await db
            .collection(queryOptions.collection)
            .countDocuments(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          result = { count: result };
          break;
        case 'distinct':
          result = await db
            .collection(queryOptions.collection)
            .distinct(queryOptions.field, this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'update_one':
          result = await db
            .collection(queryOptions.collection)
            .updateOne(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.update),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'update_many':
          result = await db
            .collection(queryOptions.collection)
            .updateMany(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.update),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'replace_one':
          result = await db
            .collection(queryOptions.collection)
            .replaceOne(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.replacement),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'find_one_replace':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndReplace(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.replacement),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'find_one_update':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndUpdate(
              this.parseEJSON(queryOptions.filter),
              this.parseEJSON(queryOptions.update),
              this.parseEJSON(queryOptions.options)
            );
          break;
        case 'find_one_delete':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndDelete(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'delete_one':
          result = await db
            .collection(queryOptions.collection)
            .deleteOne(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'delete_many':
          result = await db
            .collection(queryOptions.collection)
            .deleteMany(this.parseEJSON(queryOptions.filter), this.parseEJSON(queryOptions.options));
          break;
        case 'bulk_write':
          result = await db
            .collection(queryOptions.collection)
            .bulkWrite(this.parseEJSON(queryOptions.operations), this.parseEJSON(queryOptions.options));
          break;
        case 'aggregate':
          result = await db
            .collection(queryOptions.collection)
            .aggregate(this.parseEJSON(queryOptions.pipeline), this.parseEJSON(queryOptions.options))
            .toArray();
          break;
      }
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let errorDetails = {};

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        errorDetails = {
          name: error.name,
          code: (error as any).code || null,
          codeName: (error as any).codeName || null,
          keyPattern: (error as any).keyPattern || null,
          keyValue: (error as any).keyValue || null,
        };
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    } finally {
      await close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    const { db, close } = await this.getConnection(sourceOptions);

    try {
      const collections = await db.listCollections().toArray();

      const result = collections.map((col) => ({
        collection_name: col.name,
        type: col.type || 'collection',
      }));

      return {
        status: 'ok',
        data: result,
      };
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch collections', errorMessage, {});
    } finally {
      await close();
    }
  }

  parseEJSON(maybeEJSON?: string): any {
    if (!maybeEJSON) return {};

    return EJSON.parse(JSON.stringify(JSON5.parse(maybeEJSON)));
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { db, close } = await this.getConnection(sourceOptions);
    await db.listCollections().toArray();
    await close();

    return {
      status: 'ok',
    };
  }

async getConnection(sourceOptions: SourceOptions): Promise<any> {
  let db = null;
  let client;
  let sshResources: { ssh: SSHClient; server: net.Server } | null = null;
  const connectionType = sourceOptions['connection_type'];

  validateSSHOptions(sourceOptions);

  if (connectionType === 'manual') {
    const format = sourceOptions.connection_format || 'mongodb';
    const database = sourceOptions.database;
    let host = sourceOptions.host;
    let port = Number(sourceOptions.port) || 27017;
    const username = encodeURIComponent(sourceOptions.username || '');
    const password = encodeURIComponent(sourceOptions.password || '');

    if (format === 'mongodb+srv' && sourceOptions.ssh_enabled === 'enabled') {
      throw new QueryError('Invalid configuration', 'SSH tunnel is not supported with mongodb+srv format', {});
    }

    if (sourceOptions.ssh_enabled === 'enabled') {
      const localPort = sourceOptions.ssh_local_port || await getAvailablePort();
      const dstHost = sourceOptions.ssh_dst_host || host;
      const dstPort = sourceOptions.ssh_dst_port || port;

      sshResources = await createSSHTunnel({
        host: sourceOptions.ssh_host,
        port: sourceOptions.ssh_port || 22,
        username: sourceOptions.ssh_username,
        authType: sourceOptions.ssh_auth_type,
        password: sourceOptions.ssh_password,
        privateKey: sourceOptions.ssh_private_key,
        passphrase: sourceOptions.ssh_passphrase || undefined,
        dstHost,
        dstPort,
        localPort,
      });

      host = '127.0.0.1';
      port = localPort;
    }

    const needsAuthentication = username !== '' && password !== '';
    let uri = '';

    if (format === 'mongodb') {
      uri = needsAuthentication
        ? `mongodb://${username}:${password}@${host}:${port}`
        : `mongodb://${host}:${port}`;
    } else {
      uri = needsAuthentication
        ? `mongodb+srv://${username}:${password}@${host}`
        : `mongodb+srv://${host}`;
    }

    let clientOptions: any = {};

    if (sourceOptions.tls_certificate === 'client_certificate') {
      const secureContext = tls.createSecureContext({
        ca: sourceOptions.ca_cert,
        cert: sourceOptions.client_cert,
        key: sourceOptions.client_key,
      });
      clientOptions = {
        tls: true,
        secureContext,
      };
    }

    if (sourceOptions.tls_certificate === 'ca_certificate') {
      const secureContext = tls.createSecureContext({
        ca: sourceOptions.ca_cert,
      });

      if (sourceOptions.query_params) {
        uri += sourceOptions.query_params.startsWith('?')
          ? sourceOptions.query_params
          : `?${sourceOptions.query_params}`;
      }

      clientOptions = {
        tls: true,
        secureContext,
      };
    }

    if (!clientOptions.tls && sourceOptions.use_ssl === 'enabled') {
      clientOptions.tls = true;
    }

    client = new MongoClient(uri, clientOptions);
    await client.connect();
    db = client.db(database);
} else {
  const connStr = sourceOptions.connection_string.trim();
  const explicitFormat = sourceOptions.connection_format;
  const explicitDb = sourceOptions.database;
  const explicitHost = sourceOptions.host;
  const explicitPort = sourceOptions.port;
  const explicitUser = sourceOptions.username;
  const explicitPass = sourceOptions.password;
  const explicitQueryParams = sourceOptions.query_params;

  const protocolMatch = connStr.match(/^(mongodb(?:\+srv)?):\/\//);
  const protocol = protocolMatch ? protocolMatch[1] : explicitFormat;

  const withoutProtocol = connStr.replace(/^(mongodb(?:\+srv)?):\/\//, "");
  const lastAt = withoutProtocol.lastIndexOf("@");
  const authPart = lastAt !== -1 ? withoutProtocol.slice(0, lastAt) : "";
  const restPart = lastAt !== -1 ? withoutProtocol.slice(lastAt + 1) : withoutProtocol;

  const restSplit = restPart.split("/");
  const hostsPart = restSplit[0];
  const dbAndParamsPart = restSplit.slice(1).join("/") || "";

  const dbNameFromConn = dbAndParamsPart.split("?")[0] || "";
  const queryParamsFromConn = dbAndParamsPart.includes("?")
    ? `?${dbAndParamsPart.split("?")[1]}`
    : "";

  let connUser = "";
  let connPass = "";

  if (authPart.includes(":")) {
    const colonIdx = authPart.indexOf(":");
    connUser = decodeURIComponent(authPart.slice(0, colonIdx));
    connPass = decodeURIComponent(authPart.slice(colonIdx + 1));
  }

  const finalUser = explicitUser || connUser || "";
  const finalPass = explicitPass || connPass || "";
  const needsAuth = finalUser !== "" && finalPass !== "";
  const hostsList = explicitHost
    ? (() => {
        const list = hostsPart.split(",");
        const newPort = explicitPort ? `:${explicitPort}` : "";
        const existingPort = list[0].includes(":") ? `:${list[0].split(":")[1]}` : "";
        list[0] = newPort ? `${explicitHost}${newPort}` : `${explicitHost}${existingPort}`;
        return list;
      })()
    : hostsPart.split(",");

  if (sourceOptions.ssh_enabled === 'enabled') {
    if (protocol === 'mongodb+srv') {
      throw new QueryError('Invalid configuration', 'SSH tunnel is not supported with mongodb+srv format', {});
    }

    const localPort = sourceOptions.ssh_local_port || await getAvailablePort();
    const firstHostname = (hostsList[0] || '').split(':')[0] || 'localhost';
    const firstPort = Number((hostsList[0] || '').split(':')[1]) || 27017;
    const dstHost = sourceOptions.ssh_dst_host || firstHostname;
    const dstPort = sourceOptions.ssh_dst_port || firstPort;

    sshResources = await createSSHTunnel({
      host: sourceOptions.ssh_host,
      port: sourceOptions.ssh_port || 22,
      username: sourceOptions.ssh_username,
      authType: sourceOptions.ssh_auth_type,
      password: sourceOptions.ssh_password,
      privateKey: sourceOptions.ssh_private_key,
      passphrase: sourceOptions.ssh_passphrase || undefined,
      dstHost,
      dstPort,
      localPort,
    });

    hostsList.splice(0, hostsList.length, `127.0.0.1:${localPort}`);
  }

  const finalHosts = hostsList.join(",");
  const finalDb = explicitDb || dbNameFromConn || "";
  const authSection = needsAuth
    ? `${encodeURIComponent(finalUser)}:${encodeURIComponent(finalPass)}@`
    : "";

  let finalUri = `${protocol}://${authSection}${finalHosts}`;

  let queryParamsToUse = "";
  if (explicitQueryParams) {
    queryParamsToUse = explicitQueryParams.startsWith("?")
      ? explicitQueryParams
      : `?${explicitQueryParams}`;
  } else if (queryParamsFromConn) {
    queryParamsToUse = queryParamsFromConn;
  }

  if (queryParamsToUse) {
    finalUri += queryParamsToUse;
  }

  const paramsLower = queryParamsToUse.toLowerCase();
  const hasSSLInParams = paramsLower.includes('ssl=') || paramsLower.includes('tls=');

  const clientOptions: any = {};
  const isSrvConnection = sourceOptions.connection_format === 'mongodb+srv';
  if (sourceOptions.use_ssl === 'enabled') {
    clientOptions.tls = true;
  } else if (!hasSSLInParams && isSrvConnection) {
    clientOptions.tls = true;
  }
  client = new MongoClient(finalUri, clientOptions);
  await client.connect();
  db = client.db(finalDb);
}
  return {
    db,
    close: async () => {
      await client?.close?.();
      closeSshResources(sshResources);
    },
  };
}
}
