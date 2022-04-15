import { QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { Client } from '@notionhq/client';

export default class Notion implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const notionClient = await this.getConnection(sourceOptions);
    console.log(notionClient);
    return {
      status: 'ok',
      data: {},
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
