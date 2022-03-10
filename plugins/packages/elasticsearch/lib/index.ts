import { ConnectionTestResult, QueryService, QueryResult } from '@tooljet-plugins/common';
import { getDocument, updateDocument } from './operations';
import { indexDocument, search } from './operations';
import { Client } from '@opensearch-project/opensearch';
import { SourceOptions, QueryOptions } from './types';

export default class ElasticsearchService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
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

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    await client.info();

    return {
      status: 'ok',
    };
  }

  determineProtocol(sourceOptions: SourceOptions) {
    // Scheme was hardcoded as https earlier
    // Thus checking it to keep things backwards copatible
    // Need a migration to fix the data for existing es datasources otherwise
    const scheme = sourceOptions.scheme;
    const sslEnabled = sourceOptions.ssl_enabled;
    if (scheme && sslEnabled === undefined) {
      return 'https';
    }
    return sslEnabled ? 'https' : 'http';
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const host = sourceOptions.host;
    const port = sourceOptions.port;
    const username = sourceOptions.username;
    const password = sourceOptions.password;
    const protocol = this.determineProtocol(sourceOptions);

    let url = '';

    if (username || password) {
      url = `${protocol}://${username}:${password}@${host}:${port}`;
    } else {
      url = `${protocol}://${host}:${port}`;
    }

    return new Client({ node: url });
  }
}
