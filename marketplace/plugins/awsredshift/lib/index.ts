import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import {
  RedshiftDataClient,
  ExecuteStatementCommand,
  GetStatementResultCommand,
  DescribeStatementCommand,
} from '@aws-sdk/client-redshift-data';

export default class Awsredshift implements QueryService {
  async getConnection(sourceOptions: SourceOptions): Promise<RedshiftDataClient> {
    const region = sourceOptions.region;
    const credentials = {
      accessKeyId: sourceOptions.access_key,
      secretAccessKey: sourceOptions.secret_key,
    };
    const client = new RedshiftDataClient({ region, credentials });
    return client;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    const input = {
      Sql: 'SELECT 1',
      Database: sourceOptions.database,
      WithEvent: true,
      WorkgroupName: sourceOptions.workgroup_name,
    };
    const command = new ExecuteStatementCommand(input);
    const result = await client.send(command);
    return {
      status: 'ok',
      data: result,
    };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    try {
      const input = {
        Sql: queryOptions.sql_query,
        Database: sourceOptions.database,
        WithEvent: false,
        WorkgroupName: sourceOptions.workgroup_name,
      };
      const isSelectQuery = queryOptions.sql_query.trim().toLowerCase().startsWith('select');
      const isDeleteQuery = queryOptions.sql_query.trim().toLowerCase().startsWith('delete');
      const isUpdateQuery = queryOptions.sql_query.trim().toLowerCase().startsWith('update');
      const isInsertQuery = queryOptions.sql_query.trim().toLowerCase().startsWith('insert');
      const client = await this.getConnection(sourceOptions);
      const command = new ExecuteStatementCommand(input);
      const executeResult = await client.send(command);

      //Polling for the above query
      const describeInput = { Id: executeResult.Id };
      const maxPollingTime = 300;
      const pollingInterval = 50;
      let pollingTime = 0;

      let status = 'SUBMITTED';
      let notSelectQueryResult;
      while (status !== 'FINISHED' && pollingTime < maxPollingTime) {
        const describeCommand = new DescribeStatementCommand(describeInput);
        const describeResult = await client.send(describeCommand);
        notSelectQueryResult = describeResult;
        status = describeResult.Status;
        const error = describeResult.Error;
        if (status === 'FAILED' || (status === 'ABORTED' && describeResult.ResultSize === -1)) {
          throw new Error(error);
        }
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        pollingTime += pollingInterval;
      }

      if (isSelectQuery) {
        const getResultCommand = new GetStatementResultCommand({ Id: executeResult.Id });
        const results = await client.send(getResultCommand);
        return {
          status: 'ok',
          data: results.Records,
        };
      } else if (isDeleteQuery || isUpdateQuery || isInsertQuery) {
        return {
          status: 'ok',
          data: notSelectQueryResult,
        };
      } else {
        return {
          status: 'ok',
          data: { result: 'Query executed successfully', query: queryOptions.sql_query },
        };
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
  }
}
