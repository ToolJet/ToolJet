import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
const Redis = require('ioredis');
import { QueryError } from 'src/modules/data_sources/query.error';

@Injectable()
export default class RedisQueryService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    const query = queryOptions.query;

    const client = await this.getConnection(sourceOptions);

    try {
      const splitQuery = query.split(' ');
      const command = splitQuery[0];
      const args = splitQuery.length > 0 ? splitQuery.slice(1) : [];
      result = await client.call(command, args);
    } catch (err) {
      client.disconnect();
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    await client.ping();

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    const username = sourceOptions.username;
    const host = sourceOptions.host;
    const password = sourceOptions.password;
    const port = sourceOptions.port;

    const client = new Redis(port, host, {
      maxRetriesPerRequest: 1,
      username,
      password,
    });
    return client;
  }
}
