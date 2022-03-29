import {
  ConnectionTestResult,
  QueryError,
  QueryResult,
  QueryService,
} from "@tooljet-plugins/common";
import { SourceOptions, QueryOptions } from "./types";
// import got, { Headers } from "got";
const r = require("rethinkdb");
const JSON5 = require("json5");

export default class Rethinkdb implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    let result: any = {};
    let response = null;
    // const { port, host, protocol } = sourceOptions;
    const { operation } = queryOptions;
    // const client = await this.getConnection(sourceOptions);

    try {
      switch (operation) {
        case "db_list":
          const r = require("rethinkdb");
          r.connect({ host: "localhost", port: 28015 }, function (err, conn) {
            if (err) throw err;
            // r.db('test').tableCreate('authors').run(conn, function(err, result) {
            r.dbList().run(conn, function (err, res) {
              if (err) throw err;
              console.log(
                "************************",
                JSON.stringify(res, null, 2)
              );
              result = res;
            });
          });

          break;
        case "create_table":
          const connection = await this.getConnections();

          response = await this.createTable(connection, "neweee");
          result = this.parseJSON(response);
          break;
        // case 'get_file':
        //   result = await getFile(client, queryOptions);
        //   break;
        // case 'upload_file':
        //   result = await uploadFile(client, queryOptions);
        //   break;
        // case 'signed_url_for_get':
        //   result = await signedUrlForGet(client, queryOptions);
        //   break;
        // case 'signed_url_for_put':
        //   result = await signedUrlForPut(client, queryOptions);
        //   break;
      }
    } catch (error) {
      console.log(error);
      throw new QueryError("Query could not be completed", error.message, {});
    }

    return {
      status: "ok",
      data: result,
    };
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    this.getConnections();
    return {
      status: "ok",
    };
  }
  async getConnections(): Promise<any> {
    let connection = null;
    r.connect(
      {
        db: "test",
        host: "localhost",
        port: "28015",
      },
      (err, conn) => {
        if (err) throw err;
        connection = conn;
        return conn;
      }
    );
  }
  createTable = (conn, tableName) => {
    const r = require("rethinkdb");
    r.connect({ host: "localhost", port: 28015 }, function (err, conn) {
      if (err) throw err;
      // r.db('test').tableCreate('authors').run(conn, function(err, result) {
      r.tableCreate(tableName).run(conn, (err, result) => {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
        return result;
      });
    });
    // r.tableCreate(tableName).run(conn, (err, result) => {
    //   if (err) throw err;
    //   console.log(JSON.stringify(result, null, 2));
    //   return result
    // });
  };

  insertDocuments = (conn, tableName, item) => {
    r.table(tableName)
      .insert({ item })
      .run(conn, function (err, res) {
        if (err) throw err;
        console.log(res);
      });
  };

  retreiveDocuments = (conn) => {
    r.table("users").run(conn, function (err, cursor) {
      if (err) throw err;
      cursor.toArray(function (err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
      });
    });
  };
  deleteDocuments = (conn) => {
    r.table("users")
      .filter(r.row("posts").count().lt(3))
      .delete()
      .run(conn, function (err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
      });
  };
  updateDocuments = (conn) => {
    r.table("authors")
      .update({ type: "fictional" })
      .run(conn, function (err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
      });
  };
  listDatabase = () => {
    const r = require("rethinkdb");
    r.connect({ host: "localhost", port: 28015 }, function (err, conn) {
      if (err) throw err;
      // r.db('test').tableCreate('authors').run(conn, function(err, result) {
      r.dbList().run(conn, function (err, result) {
        if (err) throw err;
        console.log(
          "************************",
          JSON.stringify(result, null, 2)
        );
        return result;
      });
    });
  };
  listDocumentByIndex = (conn) => {
    r.table("dc")
      .getAll("superman")
      .run(conn, function (err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
      });
  };
  private parseJSON(json?: string): object {
    if (!json) return {};

    return JSON5.stringify(json, null, 2);
  }
}
