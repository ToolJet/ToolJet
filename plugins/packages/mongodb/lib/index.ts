import { QueryResult, QueryService, QueryError, ConnectionTestResult } from '@tooljet-plugins/common';
const { MongoClient } = require('mongodb');
const JSON5 = require('json5');
import { EJSON } from 'bson';
import { SourceOptions, QueryOptions } from './types';
import tls from 'tls';

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
    let db = null,
      client;
    const connectionType = sourceOptions['connection_type'];

    if (connectionType === 'manual') {
      const format = sourceOptions.connection_format; 
      const database = sourceOptions.database;
      const host = sourceOptions.host;
      const port = sourceOptions.port || undefined ;
      const username = encodeURIComponent(sourceOptions.username);
      const password = encodeURIComponent(sourceOptions.password);

      const needsAuthentication = username !== '' && password !== '';
      let uri = '';

      if(format === 'mongodb'){
       uri = needsAuthentication
        ? `mongodb://${username}:${password}@${host}:${port}`
        : `mongodb://${host}:${port}`;
      }else{
       uri = needsAuthentication
        ? `mongodb+srv://${username}:${password}@${host}`
        : `mongodb+srv://${host}`;
      }

      let clientOptions = {};

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

        clientOptions = {
          tls: true,
          secureContext,
        };
      }

      client = new MongoClient(uri, clientOptions);
      await client.connect();

      db = client.db(database);
      } else {
      const format = sourceOptions.connection_format;
      const database = sourceOptions.database;
      const conn = sourceOptions['connection_string'];
      const baseMatch = conn.match(/^mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)/);
      const extractedUsername = baseMatch ? baseMatch[2] : '';
      const extractedPassword = baseMatch ? baseMatch[3] : '';
      const extractedHost = baseMatch ? baseMatch[4] : '';

      const username = sourceOptions.username
        ? encodeURIComponent(sourceOptions.username)
        : encodeURIComponent(extractedUsername);

      const password = sourceOptions.password
        ? encodeURIComponent(sourceOptions.password)
        : encodeURIComponent(extractedPassword);

      const host = sourceOptions.host || extractedHost.split(':')[0];
      const port = sourceOptions.port || (extractedHost.includes(':') ? extractedHost.split(':')[1] : '');

      const needsAuthentication = username !== '' && password !== '';

      let uri = '';

      if (format === 'mongodb') {
        const hostPort = port ? `${host}:${port}` : host;
        uri = needsAuthentication
          ? `mongodb://${username}:${password}@${hostPort}`
          : `mongodb://${hostPort}`;
      } else {
        uri = needsAuthentication
          ? `mongodb+srv://${username}:${password}@${host}`
          : `mongodb+srv://${host}`;
      }

      const isSrv = format === 'mongodb+srv';  

      const clientOptions = {
        ...(isSrv && { tls: true }),
        ...(sourceOptions.use_ssl === true && { tls: true })
      };

      client = new MongoClient(uri, clientOptions);
      await client.connect();

      db = client.db(database);
    }

    return {
      db,
      close: async () => {
        await client?.close?.();
      },
    };
  }
}
