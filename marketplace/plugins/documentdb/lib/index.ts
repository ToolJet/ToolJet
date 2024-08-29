import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
const { MongoClient } = require('mongodb');
const JSON5 = require('json5');
import { EJSON } from 'bson';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Client } from 'ssh2';

export default class Documentdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { db, close } = await this.getConnection(sourceOptions);
    let result = {};
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'list_collections':
          result = await db.listCollections().toArray();
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
    } catch (err) {
      console.log(err);
      throw new QueryError('Query could not be completed', err.message, {});
    } finally {
      await close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  parseEJSON(maybeEJSON?: string): any {
    if (!maybeEJSON) return {};
    return EJSON.parse(JSON.stringify(JSON5.parse(maybeEJSON)));
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { db, close } = await this.getConnection(sourceOptions);
    try {
      await db.listCollections().toArray();
      return {
        status: 'ok',
      };
    } catch (error) {
      console.error('Failed to test connection:', error);
      return {
        status: 'failed',
        message: `Error testing connection: ${error.message}`,
      };
    } finally {
      await close();
    }
  }

  //USING SSH2
  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    let tlsCAFilePath = null;
    if (sourceOptions.ca_cert) {
      tlsCAFilePath = await this.writeTempCACertificate(sourceOptions.ca_cert);
    }

    const sshConfig = {
      host: sourceOptions.sshHost,
      port: Number(sourceOptions.sshPort) || 22,
      username: sourceOptions.sshUser,
      privateKey: sourceOptions.sshKey,
    };

    try {
      if (sourceOptions.connection_type === 'manual') {
        return await this.manualConnectionViaSSHTunnel(sourceOptions, tlsCAFilePath, sshConfig);
      } else {
        return await this.stringConnectionViaSSHTunnel(sourceOptions, tlsCAFilePath, sshConfig);
      }
    } catch (error) {
      console.error('Error in getConnection:', error);
      if (tlsCAFilePath) {
        await this.cleanupTempCACertificate(tlsCAFilePath);
      }
      throw error;
    }
  }

  private async manualConnectionViaSSHTunnel(sourceOptions: SourceOptions, tlsCAFilePath, sshConfig): Promise<any> {
    const dbConfig = {
      srcHost: 'localhost',
      srcPort: 0,
      dstHost: sourceOptions.host,
      dstPort: Number(sourceOptions.port) || 27017,
      localPort: 0,
    };
    const username = sourceOptions.username;
    const password = sourceOptions.password;
    const database = sourceOptions.database;
    return this.connectToMongoDB(sshConfig, dbConfig, tlsCAFilePath, username, password, database);
  }

  private async stringConnectionViaSSHTunnel(sourceOptions: SourceOptions, tlsCAFilePath, sshConfig): Promise<any> {
    const connectionString = sourceOptions.connection_string;
    const uriPattern = /^mongodb:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/?([^?]*)/;
    const match = connectionString.match(uriPattern);

    if (!match) {
      throw new Error('Invalid MongoDB connection string format');
    }

    const username = match[1];
    const password = match[2];
    const dstHost = match[3];
    const dstPort = Number(match[4]);
    const database = match[5];

    const dbConfig = {
      srcHost: 'localhost',
      srcPort: 0,
      dstHost,
      dstPort,
      localPort: 0,
    };

    return this.connectToMongoDB(sshConfig, dbConfig, tlsCAFilePath, username, password, database);
  }

  private async connectToMongoDB(sshConfig, dbConfig, tlsCAFilePath, username, password, database?): Promise<any> {
    const sshClient = new Client();

    return new Promise((resolve, reject) => {
      sshClient
        .on('ready', () => {
          sshClient.forwardOut(
            dbConfig.srcHost,
            dbConfig.srcPort,
            dbConfig.dstHost,
            dbConfig.dstPort,
            (err, stream) => {
              if (err) {
                sshClient.end();
                reject(err);
                return;
              }

              const server = require('net').createServer((socket) => {
                stream.pipe(socket).pipe(stream);
              });

              server.listen(dbConfig.localPort, dbConfig.srcHost, async () => {
                const localPort = server.address().port;
                const uri = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${
                  dbConfig.srcHost
                }:${localPort}/${database}?retryWrites=false`;

                const clientOptions: any = {
                  useNewUrlParser: true,
                  useUnifiedTopology: true,
                  connectTimeoutMS: 30000,
                  socketTimeoutMS: 45000,
                  directConnection: true,
                };

                if (tlsCAFilePath) {
                  clientOptions.tls = true;
                  clientOptions.tlsCAFile = tlsCAFilePath;
                }

                try {
                  const client = new MongoClient(uri, clientOptions);
                  await client.connect();
                  const db = client.db(database);
                  resolve({
                    db,
                    close: async () => {
                      try {
                        if (client) await client.close();
                        if (server) server.close();
                        if (sshClient) sshClient.end();
                      } catch (error) {
                        console.error('Error during cleanup:', error);
                      } finally {
                        if (tlsCAFilePath) {
                          await this.cleanupTempCACertificate(tlsCAFilePath);
                        }
                      }
                    },
                  });
                } catch (err) {
                  console.error('Error connecting to MongoDB:', err);
                  reject(err);
                }
              });
            }
          );
        })
        .on('error', (err) => {
          console.error('SSH Client Error:', err);
          reject(err);
        })
        .connect(sshConfig);
    });
  }

  private async writeTempCACertificate(caCertificate: string): Promise<string> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-amazonDocumentDb'));
    const uniqueFilename = `${uuidv4()}.pem`;
    const caFilePath = path.join(tempDir, uniqueFilename);
    await fs.writeFile(caFilePath, caCertificate);
    return caFilePath;
  }

  private async cleanupTempCACertificate(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      const dirPath = path.dirname(filePath);
      await fs.rmdir(dirPath);
    } catch (error) {
      console.error('Error cleaning up temporary CA certificate:', error);
    }
  }
}
