import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
const JSON5 = require('json5');
const { MongoClient } = require('mongodb');

@Injectable()
export default class MongodbService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
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
            .insertOne(this.parseJSON(queryOptions.document), this.parseJSON(queryOptions.options));
          break;
        case 'insert_many':
          result = await db
            .collection(queryOptions.collection)
            .insertMany(this.parseJSON(queryOptions.document), this.parseJSON(queryOptions.options));
          break;
        case 'find_one':
          result = await db
            .collection(queryOptions.collection)
            .findOne(this.parseJSON(queryOptions.filter), this.parseJSON(queryOptions.options));
          break;
        case 'find_many':
          result = await db
            .collection(queryOptions.collection)
            .find(this.parseJSON(queryOptions.filter), this.parseJSON(queryOptions.options))
            .toArray();
          break;
        case 'count_total':
          result = await db
            .collection(queryOptions.collection)
            .estimatedDocumentCount(this.parseJSON(queryOptions.options));
          result = { count: result };
          break;
        case 'count':
          result = await db
            .collection(queryOptions.collection)
            .countDocuments(this.parseJSON(queryOptions.filter), this.parseJSON(queryOptions.options));
          result = { count: result };
          break;
        case 'distinct':
          result = await db
            .collection(queryOptions.collection)
            .distinct(queryOptions.field, this.parseJSON(queryOptions.filter), this.parseJSON(queryOptions.options));
          break;
        case 'update_one':
          result = await db
            .collection(queryOptions.collection)
            .updateOne(
              this.parseJSON(queryOptions.filter),
              this.parseJSON(queryOptions.update),
              this.parseJSON(queryOptions.options)
            );
          break;
        case 'update_many':
          result = await db
            .collection(queryOptions.collection)
            .updateMany(
              this.parseJSON(queryOptions.filter),
              this.parseJSON(queryOptions.update),
              this.parseJSON(queryOptions.options)
            );
          break;
        case 'replace_one':
          result = await db
            .collection(queryOptions.collection)
            .replaceOne(
              this.parseJSON(queryOptions.filter),
              this.parseJSON(queryOptions.replacement),
              this.parseJSON(queryOptions.options)
            );
          break;
        case 'find_one_replace':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndReplace(
              this.parseJSON(queryOptions.filter),
              this.parseJSON(queryOptions.replacement),
              this.parseJSON(queryOptions.options)
            );
          break;
        case 'find_one_update':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndUpdate(
              this.parseJSON(queryOptions.filter),
              this.parseJSON(queryOptions.update),
              this.parseJSON(queryOptions.options)
            );
          break;
        case 'find_one_delete':
          result = await db
            .collection(queryOptions.collection)
            .findOneAndDelete(this.parseJSON(queryOptions.filter), this.parseJSON(queryOptions.options));
          break;
        case 'delete_one':
          result = await db
            .collection(queryOptions.collection)
            .deleteOne(this.parseJSON(queryOptions.filter), this.parseJSON(queryOptions.options));
          break;
        case 'delete_many':
          result = await db
            .collection(queryOptions.collection)
            .deleteMany(this.parseJSON(queryOptions.filter), this.parseJSON(queryOptions.options));
          break;
        case 'bulk_write':
          result = await db
            .collection(queryOptions.collection)
            .bulkWrite(this.parseJSON(queryOptions.operations), this.parseJSON(queryOptions.options));
          break;
        case 'aggregate':
          result = await db
            .collection(queryOptions.collection)
            .aggregate(this.parseJSON(queryOptions.pipeline), this.parseJSON(queryOptions.options))
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

  parseJSON(json?: string): any {
    if (!json) {
      return {};
    }
    return JSON5.parse(json, this.dateTimeReviver);
  }

  dateTimeReviver(key: string, value?: any): any {
    if (typeof value === 'string') {
      const a = /new Date\((-?\d*)\)/.exec(value);
      if (a) {
        return new Date(+a[1]);
      }
    }
    return value;
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const { db, close } = await this.getConnection(sourceOptions);
    await db.listCollections().toArray();
    await close();

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    let db = null,
      client;
    const connectionType = sourceOptions['connection_type'];

    if (connectionType === 'manual') {
      const database = sourceOptions.database;
      const host = sourceOptions.host;
      const port = sourceOptions.port;
      const username = sourceOptions.username;
      const password = sourceOptions.password;

      const needsAuthentication = username !== '' && password !== '';
      const uri = needsAuthentication
        ? `mongodb://${username}:${password}@${host}:${port}`
        : `mongodb://${host}:${port}`;

      client = new MongoClient(uri, {
        directConnection: true,
      });
      await client.connect();

      db = client.db(database);
    } else {
      const connectionString = sourceOptions['connection_string'];
      client = new MongoClient(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
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
