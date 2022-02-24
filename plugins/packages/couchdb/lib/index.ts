import { QueryError, QueryResult, QueryService } from "@tooljet-plugins/common";
import { SourceOptions, QueryOptions } from "./types";
import got from "got";
export default class Couchdb implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    let result = {};
    let response = null;
    const { operation, record_id,limit,view_url,start_key,end_key,skip } = queryOptions;
    const { username, password, port, host, database } = sourceOptions;
    const revision_id = queryOptions.rev_id;

    const authHeader = () => {
      const combined = `${username}:${password}`;
      const key = Buffer.from(combined).toString("base64");
      return { Authorization: `Basic ${key}` };
    };

    try {
      switch (operation) {
        case "list_records": {
          response = await got(`${host}:${port}/${database}/_all_docs`, {
            method: "get",
            headers: authHeader(),
          });
          result = JSON.parse(response.body);
          break;
        }

        case "retrieve_record": {
          response = await got(
            `${host}:${port}/${database}/${record_id}`,
            {
              headers: authHeader(),
              method: "get",
            }
          );

          result = JSON.parse(response.body);
          break;
        }

        case "create_record": {
          response = await got(`${host}:${port}/${database}`, {
            method: "post",
            headers: authHeader(),
            json: {
              records: JSON.parse(queryOptions.body),
            },
          });
          result = JSON.parse(response.body);
          break;
        }

        case "update_record": {
          response = await got(`${host}:${port}/${database}/${record_id}`, {
            method: "put",
            headers: authHeader(),
            json: {
              _rev: revision_id,
              records: JSON.parse(queryOptions.body),
            },
          });
          result = JSON.parse(response.body);
          break;
        }

        case "delete_recordxx": {
          response = await got(
            `${host}:${port}/${database}/${record_id}`,
            {
              method: "delete",
              headers: authHeader(),
              searchParams: {
                rev:revision_id,
              },
            }
          );
          result = JSON.parse(response.body);
          break;
        }
        case "get_view": {
          response = await got(
            `${view_url}`,
            {
              method: "get",
              headers: authHeader(),
              searchParams: {
                limit,
                start_key,
                end_key,
                skip,
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
