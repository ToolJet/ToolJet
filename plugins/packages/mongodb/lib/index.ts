import { QueryResult, QueryService, QueryError, ConnectionTestResult } from '@tooljet-plugins/common';
import { MongoClient } from 'mongodb';
const JSON5 = require('json5');
import { EJSON } from 'bson';
import { SourceOptions, QueryOptions } from './types';
import tls from 'tls';
import { Client as SSHClient } from 'ssh2';
import net from 'net';

export async function createSSHTunnel(
  sshConfig: {
    host: string;
    port?: number;
    username: string;
    authType: 'password' | 'privateKey';
    password?: string;
    privateKey?: string;
    passphrase?: string;
    dstHost: string;
    dstPort: number;
    localPort: number;
  }
): Promise<{ ssh: SSHClient; server: net.Server }> {
  return new Promise((resolve, reject) => {
    const ssh = new SSHClient();

    ssh.on('ready', () => {
      const server = net.createServer((socket) => {
        socket.on('error', () => {
          socket.destroy();
        });

        ssh.forwardOut(
          socket.remoteAddress || '127.0.0.1',
          socket.remotePort || 0,
          sshConfig.dstHost,
          sshConfig.dstPort,
          (err, stream) => {
            if (err) {
              socket.destroy();
              return;
            }

            stream.on('error', () => {
              socket.destroy();
            });

            socket.pipe(stream).pipe(socket);
          }
        );
      });

      server.on('error', (err) => {
        ssh.end();
        reject(err);
      });

      server.listen(sshConfig.localPort, '127.0.0.1', () => {
        resolve({ ssh, server });
      });
    });

    ssh.on('error', reject);

    ssh.on('close', () => {
      // optional: log if needed
    });

    const connectConfig: any = {
      host: sshConfig.host,
      port: sshConfig.port || 22,
      username: sshConfig.username,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
      readyTimeout: 20000,
    };

    if (sshConfig.authType === 'password') {
      connectConfig.password = sshConfig.password;
    } else if (sshConfig.authType === 'privateKey') {
      connectConfig.privateKey = sshConfig.privateKey;
      connectConfig.passphrase = sshConfig.passphrase;
    }

    ssh.connect(connectConfig);

  });
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
  let client: MongoClient;
  let sshResources: { ssh: SSHClient; server: net.Server } | null = null;

  const connectionType = sourceOptions.connection_type;
  if (sourceOptions.ssh_enabled) {
    if (!sourceOptions.ssh_auth_type) {
      throw new QueryError(
        'Invalid SSH config',
        'ssh_auth_type is required',
        {}
      );
    }

    if (
      sourceOptions.ssh_auth_type === 'password' &&
      !sourceOptions.ssh_password
    ) {
      throw new QueryError(
        'Invalid SSH config',
        'ssh_password required for password auth',
        {}
      );
    }

    if (
      sourceOptions.ssh_auth_type === 'privateKey' &&
      !sourceOptions.ssh_private_key
    ) {
      throw new QueryError(
        'Invalid SSH config',
        'ssh_private_key required for privateKey auth',
        {}
      );
    }
  }
  
  if (connectionType === 'manual') {
    const format = sourceOptions.connection_format || 'mongodb';
    if (format === 'mongodb+srv' && sourceOptions.ssh_enabled) {
      throw new QueryError(
        'Invalid configuration',
        'SSH tunnel is not supported with mongodb+srv format',
        {}
      );
    }

    const database = sourceOptions.database;

    let host = sourceOptions.host;
    let port = Number(sourceOptions.port) || 27017;

    // ---------- SSH ----------
    if (sourceOptions.ssh_enabled) {
      const localPort = sourceOptions.ssh_local_port || 27018;

    sshResources = await createSSHTunnel({
      host: sourceOptions.ssh_host!,
      port: sourceOptions.ssh_port || 22,
      username: sourceOptions.ssh_username!,
      authType: sourceOptions.ssh_auth_type,

      password: sourceOptions.ssh_password,
      privateKey: sourceOptions.ssh_private_key,
      passphrase: sourceOptions.ssh_passphrase,

      dstHost: sourceOptions.ssh_dst_host || host,
      dstPort: sourceOptions.ssh_dst_port || port,
      localPort,
    });


      host = '127.0.0.1';
      port = localPort;
    }

    const username = encodeURIComponent(sourceOptions.username || '');
    const password = encodeURIComponent(sourceOptions.password || '');

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

    let clientOptions = {};

    // ---------- TLS ----------
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
    client = new MongoClient(uri, clientOptions);
    await client.connect();
    db = client.db(database);
  }

  else {
    const connStr = sourceOptions.connection_string.trim();
    const explicitDb = sourceOptions.database;

    let finalUri = connStr;

    // ---------- SSH ----------
    if (sourceOptions.ssh_enabled) {
      const localPort = sourceOptions.ssh_local_port || 27018;

      sshResources = await createSSHTunnel({
        host: sourceOptions.ssh_host!,
        port: sourceOptions.ssh_port || 22,
        username: sourceOptions.ssh_username!,
        authType: sourceOptions.ssh_auth_type,

        password: sourceOptions.ssh_password,
        privateKey: sourceOptions.ssh_private_key,
        passphrase: sourceOptions.ssh_passphrase,

        dstHost: sourceOptions.ssh_dst_host ,
        dstPort: sourceOptions.ssh_dst_port ,
        localPort,
      });


      finalUri = finalUri.replace(
        /(mongodb(?:\+srv)?:\/\/)(.*?@)?([^/]+)/,
        (_, proto, auth) => `${proto}${auth || ''}127.0.0.1:${localPort}`
      );
    }

    const clientOptions: any = {};
    const paramsLower = finalUri.toLowerCase();
    const hasSSL = paramsLower.includes('ssl=') || paramsLower.includes('tls=');

    if (typeof sourceOptions.use_ssl === 'boolean') {
      clientOptions.tls = sourceOptions.use_ssl;
    } else if (!hasSSL && sourceOptions.connection_format === 'mongodb+srv') {
      clientOptions.tls = true;
    }

    client = new MongoClient(finalUri, clientOptions);
    await client.connect();
    db = client.db(explicitDb);
  }

  return {
    db,
    close: async () => {
      await client?.close?.();
      if (sshResources) {
        sshResources.server.close();
        sshResources.ssh.end();
      }
    },
  };
}
}
