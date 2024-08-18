import { ConnectionTestResult, QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import Redis from 'ioredis';
import { SourceOptions, QueryOptions } from './types';
import { ConnectionOptions } from 'tls';

export default class RedisQueryService implements QueryService {
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
    try {
      await client.ping();
    } catch (err) {
      client.disconnect();
      throw new QueryError('Connection could not be established', err.message, {});
    }

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const username = sourceOptions.username;
    const host = sourceOptions.host;
    const password = sourceOptions.password;
    const port = sourceOptions.port;
    let tls: ConnectionOptions = undefined;

    if (sourceOptions.tls_enabled) {
      tls = {};
      tls.rejectUnauthorized = (sourceOptions.tls_certificate ?? 'none') != 'none';
      if (sourceOptions.tls_certificate === 'ca_certificate') {
        tls.ca = sourceOptions.ca_cert;
      }
      if (sourceOptions.tls_certificate === 'client_certificate') {
        tls.ca = sourceOptions.ca_cert;
        tls.key = sourceOptions.client_key;
        tls.cert = sourceOptions.client_cert;
      }
    }

    return new Redis(port, host, {
      maxRetriesPerRequest: 1,
      username,
      password,
      tls: tls,
    });
  }
}
