import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from "@tooljet-plugins/common";
import { SourceOptions, QueryOptions } from "./types";
import {
  AthenaClient,
  AthenaClientConfig,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  GetQueryResultsCommandOutput,
} from "@aws-sdk/client-athena";

export default class Athena implements QueryService {
  private client: AthenaClient;

  private async waitQuery(client: AthenaClient, QueryExecutionId: string) {
    const command = new GetQueryExecutionCommand({ QueryExecutionId });
    const response = await client.send(command);
    const state = response.QueryExecution.Status.State;
    if (state === "SUCCEEDED") {
      return true;
    }
    if (state === "QUEUED" || state === "RUNNING") {
      await new Promise((r) => {
        setTimeout(r, 500);
      });
      return this.waitQuery(client, QueryExecutionId);
    }
    if (state === "FAILED" || state === "CANCELLED") {
      const msg = response.QueryExecution.Status.StateChangeReason;
      throw new QueryError("Athena query failed", msg ?? "Unknown reason", {});
    }

    throw new QueryError("Athena query failed", "Unknown reason", {});
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    let result: Array<Object> = [];

    const athenaClient = await this.getConnection(sourceOptions);

    const startQueryExec = new StartQueryExecutionCommand({
      QueryString: queryOptions.query,
      QueryExecutionContext: {
        Database: sourceOptions.database,
      },
      ...(sourceOptions?.output_location?.length > 0 && {
        ResultConfiguration: {
          OutputLocation: sourceOptions.output_location,
        },
      }),
    });
    let execId: string;
    try {
      const startResp = await athenaClient.send(startQueryExec);
      execId = startResp.QueryExecutionId;
    } catch (error) {
      throw new QueryError("Query could not be started", error.messag, {});
    }

    await this.waitQuery(athenaClient, execId);

    result = await this.loadResults(athenaClient, queryOptions, execId);

    return {
      status: "ok",
      data: result,
    };
  }

  private async loadResults(
    client: AthenaClient,
    queryOptions: QueryOptions,
    QueryExecutionId: string
  ) {
    let nextToken = queryOptions.nextToken;
    const allRows: Array<Object> = [];
    let isFirstPage = true;
    do {
      const getCmd = new GetQueryResultsCommand({
        QueryExecutionId,
        ...(queryOptions.pagination?.length > 0 && {
          MaxResults: parseInt(queryOptions.pagination) + (isFirstPage ? 1 : 0), // +1 as we need to skip the header
        }),
        ...(nextToken?.length > 0 && {
          NextToken: nextToken,
        }),
      });
      let results: GetQueryResultsCommandOutput;
      try {
        results = await client.send(getCmd);
      } catch (err) {
        throw new QueryError(
          "Failed to fetch Athena results",
          (err as Error).message,
          {}
        );
      }

      const cols = results.ResultSet?.ResultSetMetadata?.ColumnInfo ?? [];
      const rows = results.ResultSet?.Rows ?? [];
      const dataRows = isFirstPage ? rows.slice(1) : rows;
      isFirstPage = false;

      const data = dataRows.map((r) =>
        r.Data!.reduce((obj, cell, idx) => {
          obj[cols[idx].Name] = cell.VarCharValue ?? null;
          return obj;
        }, {} as Record<string, any>)
      );
      allRows.push(...data);
      nextToken = results.NextToken;
    } while (nextToken);

    return allRows;
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    await this.run(sourceOptions, {
      query: "SHOW TABLES",
      pagination: "1",
      nextToken: "",
      queryExecutionId: "",
      operation: "",
    });
    return { status: "ok" };
  }

  async getConnection(sourceOptions: SourceOptions) {
    if (!this.client) {
      const clientConfig: AthenaClientConfig = {
        region: sourceOptions.region,
        credentials: {
          accessKeyId: sourceOptions.access_key,
          secretAccessKey: sourceOptions.secret_key,
        },
      };
      this.client = new AthenaClient(clientConfig);
    }

    return this.client;
  }
}
