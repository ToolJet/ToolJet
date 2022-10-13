import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
const JSON5 = require('json5');
const r = require('rethinkdb');

export default class Rethinkdb implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const connection = await this.getConnection(sourceOptions);
    let result: any = {};
    const { tablename, name, key, body } = queryOptions;
    const { database } = sourceOptions;
    let response = null;

    try {
      switch (operation) {
        case 'db_create': {
          result = await this.createDatabase(name, connection);
          break;
        }
        case 'db_drop': {
          result = await this.dropDatabase(name, connection, database);
          break;
        }
        case 'create_table': {
          result = await this.createTable(name, tablename, connection, database);
          break;
        }
        case 'drop_table': {
          result = await this.dropTable(name, tablename, connection, database);
          break;
        }
        case 'db_list': {
          result = await this.listAllDatabase(connection, database);
          break;
        }
        case 'list_table': {
          result = await this.listAllTables(name, connection, database);
          break;
        }
        case 'list_documents': {
          response = await this.listAllDocuments(name, tablename, connection, database);
          result = await response.toArray(function (err, cursor) {
            if (err) throw err;
            return cursor;
          });
          break;
        }
        case 'create_docs': {
          result = await this.insertDocument(name, tablename, body, connection, database);
          break;
        }
        case 'retrieve_docs': {
          result = await this.getDocumentByID(name, tablename, key, connection, database);
          break;
        }

        case 'delete_docs_by_id': {
          result = await this.deleteDocumentByID(name, tablename, key, connection, database);
          break;
        }
        case 'delete_all_docs': {
          result = await this.deleteAllDocument(name, tablename, connection, database);
          break;
        }
        case 'update_docs_by_id': {
          result = await this.updateDocumentByID(name, tablename, key, body, connection, database);
          break;
        }
        case 'update_all_docs': {
          result = await this.updateAllDocument(name, tablename, body, connection, database);
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

  async getConnection(sourceOptions: SourceOptions): Promise<any> {
    const { port, host, database, username, password } = sourceOptions;
    let connection = null;
    connection = r.connect(
      {
        db: database,
        host: host,
        port: port,
        ...(username?.length > 0 && { username }),
        ...(password?.length > 0 && { password }),
      },
      (err, conn) => {
        if (err) throw err;
        connection = conn;
        return conn;
      }
    );
    return connection;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const connection = await this.getConnection(sourceOptions);
    const response = await this.listAllDatabase(connection, sourceOptions.database);
    if (!response) {
      throw new Error('Connection failed');
    }
    return {
      status: 'ok',
    };
  }

  private parseJSON(json?: string): object {
    if (!json) return {};
    return JSON5.parse(json);
  }

  createDatabase = async (name, connection) => {
    const response = r.dbCreate(name).run(connection, (err, result) => {
      if (err) throw err;
      return result;
    });
    return response;
  };

  dropDatabase = async (name, connection, database) => {
    const response = r.dbDrop(name).run(connection, (err, result) => {
      if (err) throw err;
      return result;
    });
    return response;
  };

  createTable = async (name, tablename, connection, database) => {
    const response = r
      .db(name ? name : database)
      .tableCreate(tablename)
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };

  dropTable = async (name, tablename, connection, database) => {
    const response = r
      .db(name ? name : database)
      .tableDrop(tablename)
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };

  listAllDatabase = async (connection, database) => {
    const response = r.dbList().run(connection, (err, result) => {
      if (err) throw err;
      return result;
    });
    return response;
  };

  listAllTables = async (name, connection, database) => {
    const response = r
      .db(name ? name : database)
      .tableList()
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };

  listAllDocuments = async (name, tablename, connection, database) => {
    const response = r
      .db(name ? name : database)
      .table(tablename)
      .run(connection, (err, cursor) => {
        if (err) throw err;
        return cursor;
      });

    return response;
  };

  insertDocument = async (name, tablename, body, connection, database) => {
    const response = r
      .db(name ? name : database)
      .table(tablename)
      .insert(this.parseJSON(body))
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };

  deleteAllDocument = async (name, tablename, connection, database) => {
    const response = r
      .db(name ? name : database)
      .table(tablename)
      .delete()
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };

  deleteDocumentByID = async (name, tablename, key, connection, database) => {
    const response = r
      .db(name ? name : database)
      .table(tablename)
      .get(key)
      .delete()
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };
  updateAllDocument = async (name, tablename, data, connection, database) => {
    const response = r
      .db(name ? name : database)
      .table(tablename)
      .update(this.parseJSON(data))
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };
  updateDocumentByID = async (name, tablename, key, data, connection, database) => {
    const response = r
      .db(name ? name : database)
      .table(tablename)
      .get(key)
      .update(this.parseJSON(data))
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };

  getDocumentByID = async (name, tablename, key, connection, database) => {
    const response = r
      .db(name ? name : database)
      .table(tablename)
      .get(key)
      .run(connection, (err, result) => {
        if (err) throw err;
        return result;
      });
    return response;
  };
}
