import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const JSON5 = require('json5');
const r = require('rethinkdb');

export default class Rethinkdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const connection = await this.getConnection(sourceOptions);
    let result: any = {};
    const response = null;
    const { tablename, name, key, body } = queryOptions;
    const { database } = sourceOptions;

    try {
      switch (operation) {
        case 'db_create': {
          result = await this.createDatabase(name, connection);
          console.log('response >>>>>>>>', response);
          break;
        }
        case 'db_drop': {
          result = await this.dropDatabase(name, connection);
          console.log('response >>>>>>>>', response);
          break;
        }
        case 'create_table': {
          result = await this.createTable(name, tablename, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'drop_table': {
          result = await this.dropTable(name, tablename, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'db_list': {
          result = await this.listAllDatabase(connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'list_table': {
          result = await this.listAllTables(name, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'list_documents': {
          result = await this.listAllDocuments(name, tablename, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'create_docs': {
          result = await this.insertDocument(name, tablename, body, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'retreive_docs': {
          result = await this.getDocumentByID(name, tablename, key, connection);
          console.log('response >>>>>>>>', result);
          break;
        }

        case 'update_docs': {
          result = await this.listAllTables(name, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'delete_docs_by_id': {
          result = await this.deleteDocumentByID(name, tablename, key, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'delete_all_docs': {
          result = await this.deleteAllDocument(name, tablename, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'update_docs_by_id': {
          result = await this.updateDocumentByID(database, tablename, key, body, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
        case 'update_all_docs': {
          result = await this.updateAllDocument(name, tablename, body, connection);
          console.log('response >>>>>>>>', result);
          break;
        }
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: any): Promise<any> {
    const { port, host, database } = sourceOptions;
    let connection = null;
    connection = r.connect(
      {
        db: { database },
        host: { host },
        port: { port },
      },
      (err, conn) => {
        if (err) throw err;
        connection = conn;
        return conn;
      }
    );
    return connection;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const r = require('rethinkdb');

    const connection = r.expr(1);

    if (!connection) {
      throw new Error('Connection failed');
    }
    return {
      status: 'ok',
    };
  }

  parseJSON(json?: string): object {
    if (!json) return {};
    return JSON5.parse(json);
  }
  // tested
  createDatabase = async (name, connection) => {
    const response = r.connect(connection, function (err, conn) {
      if (err) throw err;
      r.dbCreate(name).run(conn, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return result;
      });
    });
    return response;
  };

  dropDatabase = async (name, connection) => {
    const response = r.dbDrop(name).run(connection, (err, result) => {
      if (err) throw err;
      console.log('*****', JSON.stringify(result, null, 2));
      return result;
    });
    return response;
  };

  // tested
  createTable = async (name, tablename, connection) => {
    const response = r.connect(
      r
        .db(name)
        .tableCreate(tablename)
        .run(connection, (err, result) => {
          if (err) throw err;
          console.log('*****', JSON.stringify(result, null, 2));
          return result;
        })
    );
    return response;
  };

  dropTable = async (name, tablename, connection) => {
    const response = r
      .db(name)
      .tableDrop(tablename)
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', result);
        return result;
      });
    return response;
  };
  // tested
  listAllDatabase = async (connection) => {
    const response = r.dbList().run(connection, (err, result) => {
      if (err) throw err;
      console.log('*****', JSON.stringify(result, null, 2));
      return result;
    });
    return response;
  };
  // tested

  listAllTables = async (database, connection) => {
    const response = r
      .db(database)
      .tableList()
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return result;
      });
    return response;
  };

  listAllDocuments = async (name, tablename, connection) => {
    const response = r
      .db(name)
      .table(tablename)
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        result.toArray(function (err, results) {
          if (err) throw err;
          return results;
        });
      });

    return response;
  };

  insertDocument = async (name, tablename, body, connection) => {
    const response = r
      .db(name)
      .table(tablename)
      .insert(body)
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return result;
      });
    return response;
  };

  deleteAllDocument = async (name, tablename, connection) => {
    const response = r
      .db(name)
      .table(tablename)
      .delete()
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return result;
      });
    return response;
  };

  deleteDocumentByID = async (name, tablename, key, connection) => {
    const response = r
      .db(name)
      .table(tablename)
      .get(key)
      .delete()
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return result;
      });
    return response;
  };
  updateAllDocument = async (name, tablename, data, connection) => {
    const response = r
      .db(name)
      .table(tablename)
      .update(data)
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return result;
      });
    return response;
  };
  updateDocumentByID = async (name, tablename, data, key, connection) => {
    const response = r
      .db(name)
      .table(tablename)
      .get(key)
      .update(data)
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return result;
      });
    return response;
  };
  // tested

  getDocumentByID = async (name, tablename, key, connection) => {
    const response = r
      .db(name)
      .table(tablename)
      .get(key)
      .run(connection, (err, result) => {
        if (err) throw err;
        console.log('*****', JSON.stringify(result, null, 2));
        return JSON.stringify(result, null, 2);
      });
    return response;
  };
}
