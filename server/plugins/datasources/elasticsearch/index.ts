import { Injectable } from '@nestjs/common';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { getDocument, updateDocument } from './operations';
import { indexDocument, search } from './operations';
const { Client } = require('@elastic/elasticsearch');

@Injectable()
export default class ElasticsearchService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    let result = {};
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'search':
          result = await search(client, queryOptions.index, queryOptions.query);
          break;
        case 'index_document':
          result = await indexDocument(client, queryOptions.index, queryOptions.body);
          break;
        case 'get':
          result = await getDocument(client, queryOptions.index, queryOptions.id);
          break;
        case 'update':
          result = await updateDocument(client, queryOptions.index, queryOptions.id, queryOptions.body);
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
    const client = await this.getConnection(sourceOptions);
    await client.info();

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    const scheme = sourceOptions.scheme;
    const host = sourceOptions.host;
    const port = sourceOptions.port;
    const username = sourceOptions.username;
    const password = sourceOptions.password;

    let url = '';

    if (username === '' || password === '') {
      url = `${scheme}://${username}:${password}@${host}:${port}`;
    } else {
      url = `${scheme}://${host}:${port}`;
    }

    return new Client({ node: url });
  }
}
