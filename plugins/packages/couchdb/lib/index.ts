import { QueryError, QueryResult, QueryService } from "@tooljet-plugins/common";
import { SourceOptions, QueryOptions } from "./types";
import got, { Headers } from "got";
export default class Couchdb implements QueryService {
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
    const port = sourceOptions.port;

    const authHeader = () => {
      const combined = `${username}:${password}`;
      const key = Buffer.from(combined).toString("base64");
      return { Authorization: `Basic ${key}` };
    };

    try {
      switch (operation) {
        case "list_records": {
          response = await got(`http://127.0.0.1:5984/users`, {
            method: "get",
            headers:{ Authorization: `Basic YWRtaW46cGFzc3dvcmQ=` },
          });
          result = JSON.parse(response.body);
          console.log("checkkkkkkkkkkkkk,result",result)
          break;
        }

        case "retrieve_record": {
          response = await got(`http://127.0.0.1:${port}/users/${recordId}`, {
            headers: { Authorization: `Basic YWRtaW46cGFzc3dvcmQ=` },
            method: "get",
          });

          result = JSON.parse(response.body);
          break;
        }

        case "create_record": {
          response = await got(`http://127.0.0.1:${port}/users`, {
            method: "post",
            headers: authHeader(),
            json: JSON.parse(queryOptions.body),
          });
          result = JSON.parse(response.body);
          break;
        }

        case "update_record": {
          response = await got(`http://127.0.0.1:${port}/users/${recordId}`, {
            method: "put",
            headers: authHeader(),
            json: {
              category: JSON.parse(queryOptions.body),
            },
          });

          result = JSON.parse(response.body);
          break;
        }

        case "delete_record": {
          response = await got(`http://127.0.0.1:${port}/users/${recordId}`, {
            method: "delete",
            headers: authHeader(),
            json: {
              _rev: queryOptions.rev_id,
            },
          });
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
