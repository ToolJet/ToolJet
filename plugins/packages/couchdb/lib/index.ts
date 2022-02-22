import { QueryError, QueryResult, QueryService } from "@tooljet-plugins/common";
import { SourceOptions, QueryOptions } from "./types";
import got, { Headers } from "got";

export default class Couchdb implements QueryService {

  authHeader(): Headers {
    return { Authorization: `Basic {btoa("admin":"password")}` };
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const recordId = queryOptions.record_id;
    const username = sourceOptions.username;
    const password = sourceOptions.password;


    try {
      switch (operation) {
        case "list_records": {
          response = await got(`http://127.0.0.1:5984/users`, {
            method: "get",
            headers: this.authHeader(),
          });
          result = JSON.parse(response.body);
          break;
        }

        case "retrieve_record": {
          response = await got(
            `http://127.0.0.1:5984/users/${recordId}`,
            {
              headers: this.authHeader(),
              method: "get",
            }
          );

          result = JSON.parse(response.body);
          break;
        }

        case "create_record": {
          response = await got(`http://127.0.0.1:5984/users`, {
            method: "post",
            headers: this.authHeader(),
            json: JSON.parse(queryOptions.body),
          });
          result = JSON.parse(response.body);
          break;
        }

        case "update_record": {
          response = await got(
            `http://127.0.0.1:5984/users/${recordId}`,
            {
              method: "put",
              headers: this.authHeader(),
              json: {
                category: JSON.parse(queryOptions.body),
              },
            }
          );

          result = JSON.parse(response.body);
          break;
        }

        case "delete_record": {
          response = await got(
            `http://127.0.0.1:5984/users/${recordId}`,
            {
              method: "delete",
              headers: this.authHeader(),
              json: {
                _rev: queryOptions.rev_id,
              },
            }
          );
          result = JSON.parse(response.body);
          break;
        }
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
}
