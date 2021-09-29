import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
const { MongoClient } = require('mongodb');

@Injectable()
export default class MongodbService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    const db = await this.getConnection(sourceOptions);
    let result = {};
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'list_collections':
          result = await db.listCollections().toArray();
          break;
        case 'insert_one':
          result = await db.collection(queryOptions.collection).insertOne(JSON.parse(queryOptions.document));
          break;
        case 'insert_many':
          result = await db.collection(queryOptions.collection).insertMany(JSON.parse(queryOptions.documents));
          break;
        case 'find_one':
          result = await db.collection(queryOptions.collection).findOne(JSON.parse(queryOptions['query']));
          break;
        case 'find':
          let resultQueryBuilder = db.collection(queryOptions.collection)
          if ("query" in queryOptions && queryOptions['query'])
            resultQueryBuilder = resultQueryBuilder.find(JSON.parse(queryOptions['query']))
          else
            resultQueryBuilder = resultQueryBuilder.find({})
          if ("sort" in queryOptions && queryOptions['sort'])
            resultQueryBuilder = resultQueryBuilder.sort(JSON.parse(queryOptions['sort']))
          if ("limit" in queryOptions && queryOptions['limit'])
            resultQueryBuilder = resultQueryBuilder.limit(JSON.parse(queryOptions['limit']))
          if ("skip" in queryOptions && queryOptions['skip'])
            resultQueryBuilder = resultQueryBuilder.sort(JSON.parse(queryOptions['skip']))
          result = await resultQueryBuilder.toArray();
          break;
      }
    } catch (err) {
      console.log(err);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const db = await this.getConnection(sourceOptions);
    await db.listCollections().toArray();

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    let db = null;
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

      const client = new MongoClient(uri, {
        directConnection: true,
      });
      await client.connect();

      db = client.db(database);
    } else {
      const connectionString = sourceOptions['connection_string'];
      const client = new MongoClient(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
      await client.connect();
      db = client.db();
    }

    return db;
  }
}
