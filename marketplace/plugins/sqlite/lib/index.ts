import { QueryError, QueryService } from '@tooljet-marketplace/common';
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export default class SqliteService implements QueryService {
  async run(sourceOptions: any, queryOptions: any): Promise<any> {
    let result = {};
    const query = queryOptions.query;

    const client = await this.getConnection(sourceOptions);

    try {
      result = await client.exec(query);
    } catch (err) {
      await client.close();
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: any): Promise<any> {
    const client = await this.getConnection(sourceOptions);
    await client.exec('');

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    const filename = sourceOptions.filename || '/tmp/sqlite.db';
    return open({
      filename,
      driver: sqlite3.cached.Database
    });
  }
}