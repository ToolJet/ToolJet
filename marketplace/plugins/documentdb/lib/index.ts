import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
const { MongoClient } = require('mongodb');
const JSON5 = require('json5');
import { EJSON } from 'bson';
import os from 'os';
import { promises as fsPromises } from 'fs';
import tls from 'tls';

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

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    let db = null,
      client;
    const connectionType = sourceOptions['connection_type'];
    const tempFiles = [];

    if (connectionType === 'manual') {
      const host = sourceOptions.host;
      const port = sourceOptions.port;
      const username = encodeURIComponent(sourceOptions.username);
      const password = encodeURIComponent(sourceOptions.password);
      const tlsCert = sourceOptions.ca_cert;

      const uri = `mongodb://${username}:${password}@${host}:${port}?authSource=admin`;
      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        directConnection: true,
      };

      if (tlsCert) {
        const tempFilePath = await this.createTempFile(tlsCert);
        tempFiles.push(tempFilePath);

        const secureContext = tls.createSecureContext({
          ca: await fsPromises.readFile(tempFilePath),
        });

        Object.assign(connectionOptions, {
          tls: true,
          tlsAllowInvalidHostnames: true,
          secureContext,
        });
      } else {
        Object.assign(connectionOptions, {
          tls: false,
          ssl: false,
        });
      }

      try {
        client = new MongoClient(uri, connectionOptions);
        await client.connect();
      } catch (error) {
        console.error('Connection failed:', error);
      }

      db = client.db();
    } else {
      const connectionString = sourceOptions['connection_string'];

      const password = connectionString.match(/(?<=:\/\/)(.*):(.*)@/)[2];

      const encodedPassword = encodeURIComponent(password);

      const encodedConnectionString = connectionString.replace(password, encodedPassword);

      client = new MongoClient(encodedConnectionString);
      await client.connect();
      db = client.db();
    }

    return {
      db,
      close: async () => {
        await client?.close?.();
        for (const filePath of tempFiles) {
          try {
            await fsPromises.unlink(filePath);
          } catch (error) {
            console.error(`Error cleaning up temp file ${filePath}:`, error);
          }
        }
      },
    };
  }

  async createTempFile(certContent: string): Promise<string> {
    const tempFilePath = `${os.tmpdir()}/cert-${Date.now()}.pem`;
    await fsPromises.writeFile(tempFilePath, certContent);
    return tempFilePath;
  }
}
