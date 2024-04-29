import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
const { MongoClient } = require('mongodb');
const JSON5 = require('json5');
import { EJSON } from 'bson';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';


export default class Documentdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const pemPath = path.join(process.cwd(), 'global-bundle.pem');
    await this.ensureFileExists(pemPath);

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

  async ensureFileExists(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      console.log('global-bundle.pem file is missing. Attempting to download...');
      const url = 'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem';
      
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log('Downloaded the global-bundle.pem file successfully.');
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {});
          console.error('Error downloading the global-bundle.pem file:', err.message);
          reject(err);
        });
      });
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
    let db = null,
      client;
    const connectionType = sourceOptions['connection_type'];

    if (connectionType === 'manual') {
      const database = sourceOptions.database;
      const host = sourceOptions.host;
      const port = sourceOptions.port;
      const username = encodeURIComponent(sourceOptions.username);
      const password = encodeURIComponent(sourceOptions.password);

      const needsAuthentication = username !== '' && password !== '';
      const uri = needsAuthentication
        ? `mongodb://${username}:${password}@${host}:${port}`
        : `mongodb://${host}:${port}`;

      client = new MongoClient(uri, {
        tlsCAFile: "global-bundle.pem"
      });
      await client.connect();

      db = client.db(database);
    } else {
      const connectionString = sourceOptions['connection_string'];

      const password = connectionString.match(/(?<=:\/\/)(.*):(.*)@/)[2];

      const encodedPassword = encodeURIComponent(password);

      const encodedConnectionString = connectionString.replace(password, encodedPassword);

      client = new MongoClient(encodedConnectionString, { useNewUrlParser: true, useUnifiedTopology: true, tlsCAFile: "global-bundle.pem" });
      await client.connect();
      db = client.db();
    }

    return {
      db,
      close: async () => {
        await client?.close?.();
      },
    };
  }
}
