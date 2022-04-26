import { QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { Client } from '@notionhq/client';
import { blockOperations, databaseOperations, pageOperations, userOperations } from './operations';

export default class Notion implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const notionClient = await this.getConnection(sourceOptions);
    const { resource, operation } = queryOptions;
    let result: any;

    switch (resource) {
      case 'database':
        result = await databaseOperations(notionClient, queryOptions, operation);
        break;
      case 'page':
        result = await pageOperations(notionClient, queryOptions, operation);
        break;
      case 'block':
        result = await blockOperations(notionClient, queryOptions, operation);
        break;
      case 'user':
        result = await userOperations(notionClient, queryOptions, operation);
        break;
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<Client> {
    const { token } = sourceOptions;

    // Initializing a client
    const notion = new Client({
      auth: token,
    });

    return notion;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const notion = await this.getConnection(sourceOptions);

    if (!notion) {
      throw new Error('Invalid token');
    }

    await notion.search({});

    return {
      status: 'ok',
    };
  }
}
