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
    const { operation, recordId } = queryOptions;
    const { username, password,port,host,database } = sourceOptions;

    const authHeader = () => {
      const combined = `${username}:${password}`;
      const key = Buffer.from(combined).toString("base64");
      return { Authorization: `Basic ${key}` };
    };

    try {
      switch (operation) {
        case "list_records": {
          response = await got(`${host}:${port}/${database}`, {
            method: "get",
            headers: authHeader(),
          });
          result = JSON.parse(response.body);
          break;
        }

        case "retrieve_record": {
          response = await got(`${host}:${port}/${database}/${recordId}`, {
            headers: authHeader(),
            method: "get",
          });

          result = JSON.parse(response.body);
          break;
        }

        case "create_record": {
          response = await got(`${host}:${port}/${database}`, {
            method: "post",
            headers: authHeader(),
            json: JSON.parse(queryOptions.body),
          });
          result = JSON.parse(response.body);
          break;
        }

        case "update_record": {
          response = await got(`${host}:${port}/${database}/${recordId}`, {
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
          response = await got(`${host}:${port}/${database}/${recordId}`, {
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
