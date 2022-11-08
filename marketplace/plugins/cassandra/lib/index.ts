import { QueryError, QueryService } from '@tooljet-marketplace/common';
const cassandra = require('cassandra-driver');

export default class CassandraQueryService implements QueryService {
  async run(sourceOptions: any, queryOptions: any): Promise<any> {
    let result = {};
    const query = queryOptions.query;

    const client = await this.getConnection(sourceOptions);

    try {
      result = await client.execute(query);
    } catch (err) {
      await client.shutdown();
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: any): Promise<any> {
    const client = await this.getConnection(sourceOptions);
    await client.execute('');

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    const contactPoints = sourceOptions.contactPoints.split(',');
    const localDataCenter = sourceOptions.localDataCenter;
    const keyspace = sourceOptions.keyspace;
    const username = sourceOptions.username;
    const password = sourceOptions.password;
    const secureConnectBundle = sourceOptions.secureConnectBundle;

    let client;

    if(secureConnectBundle) {
      client = new cassandra.Client({
        cloud: {
          secureConnectBundle,
        },
        credentials: {
          username,
          password,
        }});
    } else {
      client = new cassandra.Client({
        contactPoints,
        localDataCenter,
        keyspace
      });
    }

    await client.connect();

    return client;
  }
}