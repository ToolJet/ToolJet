import { ConnectionTestResult, QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
// import got, { Headers } from "got";
const r = require('rethinkdb');

export default class Rethinkdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const result = {};
    // let response = null;
    // const { port, host, protocol } = sourceOptions;
    // const { operation } = queryOptions;

    try {
      console.log('operation');
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    r.connect(
      {
        db: 'test',
        host: 'localhost',
        port: '28015',
      },
      (err, conn) => {
        this.createTable(conn, 'users');
      }
    );
    return {
      status: 'ok',
    };
  }
  createTable = (conn, tableName) => {
    r.tableCreate(tableName).run(conn, (err, result) => {
      if (err) throw err;
    });
  };
}
