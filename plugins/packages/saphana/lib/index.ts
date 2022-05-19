import { ConnectionTestResult, QueryService, QueryResult, QueryError } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

const hana = require('@sap/hana-client');

export default class PostgresqlQueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const connection = await this.getConnection(sourceOptions);
    let result: any;

    try {
      result = await this.execute(connection, queryOptions.query);
    } catch (err) {
      console.log(err);
      throw new QueryError('Query could not be completed', err.message, {});
    } finally {
      this.disconnect(connection);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  execute(connection, query): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      connection.exec(query, function (err, result) {
        if (err) return reject(new QueryError('Query could not be completed', err.message, {}));
        return resolve({
          status: 'ok',
          data: result,
        });
      });
    });
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const connection = await this.getConnection(sourceOptions);
    this.disconnect(connection);
    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const connection = hana.createConnection();

    const { host, port, username, password, database } = sourceOptions;

    const conn_params = {
      serverNode: `${host}:${port}`,
      uid: username,
      pwd: password,
      databaseName: database,
      encrypt: port == '443' ? true : false,
    };

    await this.connect(connection, conn_params);
    return connection;
  }

  connect(connection, conn_params): Promise<any> {
    return new Promise((resolve, reject) => {
      connection.connect(conn_params, function (err) {
        if (err) return reject(err);
        return resolve(true);
      });
    });
  }

  disconnect(connection: any) {
    try {
      if (connection) {
        connection.disconnect();
      }
    } catch (err) {
      console.error('Error while disconnecting SAP HANA', err);
    }
  }
}
