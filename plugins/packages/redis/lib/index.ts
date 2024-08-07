import { ConnectionTestResult, QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import Redis from 'ioredis';
import { SourceOptions, QueryOptions } from './types';

function isEmpty(value: number | null | undefined | string) {
  return (
    value === undefined ||
    value === null ||
    !isNaN(value as number) ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
}

export default class RedisQueryService implements QueryService {
  connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions.connection_options || []).filter((o) => {
      return o.some((e) => !isEmpty(e));
    });

    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );

    return connectionOptions;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
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

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    await client.ping();

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const username = sourceOptions.username;
    const host = sourceOptions.host;
    const password = sourceOptions.password;
    const port = sourceOptions.port;
    let tls = undefined;

    if (sourceOptions.tls) {
      tls = {
        ...this.connectionOptions(sourceOptions),
      };
    }

    return new Redis(port, host, {
      maxRetriesPerRequest: 1,
      username,
      password,
      tls: tls,
    });
  }
}
