import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  ListTableMetadataCommand,
} from '@aws-sdk/client-athena';

export default class Athena implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    let result = {};
    const athenaClient = await this.getConnection(sourceOptions);

    try {
      // If queryExecutionId is provided, just fetch results
      if (queryOptions?.queryExecutionId?.length > 0) {
        const data = await this.getQueryResults(
          athenaClient,
          queryOptions.queryExecutionId,
          queryOptions.pagination,
          queryOptions.nextToken
        );
        result = this.toJson(data);
      } else {
        // Execute new query
        const data = await this.executeQuery(
          athenaClient,
          queryOptions.query,
          sourceOptions.database,
          sourceOptions.output_location,
          queryOptions.pagination,
          queryOptions.nextToken
        );
        result = this.toJson(data);
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const athenaClient = await this.getConnection(sourceOptions);

    try {
      // Test connection by listing tables
      const command = new ListTableMetadataCommand({
        CatalogName: 'AwsDataCatalog',
        DatabaseName: sourceOptions.database,
        MaxResults: 1,
      });

      await athenaClient.send(command);

      return {
        status: 'ok',
      };
    } catch (error) {
      throw new QueryError('Connection test failed', error.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<AthenaClient> {
    return new AthenaClient({
      region: sourceOptions.region,
      credentials: {
        accessKeyId: sourceOptions.access_key,
        secretAccessKey: sourceOptions.secret_key,
      },
    });
  }

  private async executeQuery(
    client: AthenaClient,
    query: string,
    database: string,
    outputLocation: string,
    pagination?: number,
    nextToken?: string
  ): Promise<any> {
    // Start query execution
    const startCommand = new StartQueryExecutionCommand({
      QueryString: query,
      QueryExecutionContext: {
        Database: database,
      },
      ResultConfiguration: {
        OutputLocation: outputLocation || `s3://aws-athena-query-results-${Date.now()}/`,
      },
    });

    const startResponse = await client.send(startCommand);
    const queryExecutionId = startResponse.QueryExecutionId;

    // Wait for query to complete
    await this.waitForQueryToComplete(client, queryExecutionId);

    // Get results
    return await this.getQueryResults(client, queryExecutionId, pagination, nextToken);
  }

  private async waitForQueryToComplete(client: AthenaClient, queryExecutionId: string): Promise<void> {
    let isQueryRunning = true;

    while (isQueryRunning) {
      const getStatusCommand = new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      });

      const statusResponse = await client.send(getStatusCommand);
      const status = statusResponse.QueryExecution?.Status?.State;

      if (status === 'SUCCEEDED') {
        isQueryRunning = false;
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        const reason = statusResponse.QueryExecution?.Status?.StateChangeReason || 'Unknown error';
        throw new Error(`Query ${status}: ${reason}`);
      } else {
        // Wait 1 second before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async getQueryResults(
    client: AthenaClient,
    queryExecutionId: string,
    pagination?: number,
    nextToken?: string
  ): Promise<any> {
    const command = new GetQueryResultsCommand({
      QueryExecutionId: queryExecutionId,
      ...(pagination && { MaxResults: pagination }),
      ...(nextToken && { NextToken: nextToken }),
    });

    const response = await client.send(command);

    // Parse results similar to athena-express format
    const rows = response.ResultSet?.Rows || [];

    if (rows.length === 0) {
      return {
        Items: [],
        DataScannedInMB: 0,
        QueryCostInUSD: 0,
        EngineExecutionTimeInMillis: 0,
        Count: 0,
        QueryExecutionId: queryExecutionId,
        S3Location: '',
      };
    }

    // Extract column names from first row
    const columnInfo = response.ResultSet?.ResultSetMetadata?.ColumnInfo || [];
    const headers = rows[0].Data?.map((col) => col.VarCharValue || '') || [];

    // Parse data rows (skip header row)
    const items = rows.slice(1).map((row) => {
      const item: any = {};
      row.Data?.forEach((col, index) => {
        const columnName = headers[index] || columnInfo[index]?.Name || `column_${index}`;
        item[columnName] = col.VarCharValue || null;
      });
      return item;
    });

    // Get query statistics
    const statsCommand = new GetQueryExecutionCommand({
      QueryExecutionId: queryExecutionId,
    });
    const statsResponse = await client.send(statsCommand);
    const statistics = statsResponse.QueryExecution?.Statistics;
    const resultConfig = statsResponse.QueryExecution?.ResultConfiguration;

    return {
      Items: items,
      DataScannedInMB: statistics?.DataScannedInBytes
        ? Math.round((statistics.DataScannedInBytes / (1024 * 1024)) * 100) / 100
        : 0,
      QueryCostInUSD: statistics?.DataScannedInBytes
        ? Math.round((statistics.DataScannedInBytes / (1024 * 1024 * 1024)) * 0.005 * 1000) / 1000
        : 0,
      EngineExecutionTimeInMillis: statistics?.EngineExecutionTimeInMillis || 0,
      Count: items.length,
      QueryExecutionId: queryExecutionId,
      S3Location: resultConfig?.OutputLocation || '',
      ...(response.NextToken && { NextToken: response.NextToken }),
    };
  }

  private toJson(data: any): any {
    return JSON.parse(
      JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(/"(-?\d+)n"/g, (_, a) => a)
    );
  }
}
