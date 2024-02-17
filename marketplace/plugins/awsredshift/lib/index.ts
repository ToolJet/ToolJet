import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import {
  RedshiftDataClient,
  ExecuteStatementCommand,
  GetStatementResultCommand,
  DescribeStatementCommand,
} from '@aws-sdk/client-redshift-data';

export default class Awsredshift implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    try {
      const input = {
        Sql: queryOptions.sql_query,
        SecretArn: sourceOptions.secretARN,
        Database: sourceOptions.database,
        WithEvent: false,
        WorkgroupName: sourceOptions.workgroup_name,
        // Parameters: [
        //   {
        //     name: '', // required
        //     value: '', // required
        //   },
        // ],
      };
      const isSelectQuery = queryOptions.sql_query.trim().toLowerCase().startsWith('select');
      const client = await this.getConnection(sourceOptions);
      const command = new ExecuteStatementCommand(input);
      const executeResult = await client.send(command);

      //Polling for the above query
      if (isSelectQuery) {
        const describeInput = { Id: executeResult.Id };
        let status = 'SUBMITTED';
        while (status !== 'FINISHED') {
          const describeCommand = new DescribeStatementCommand(describeInput);
          const describeResult = await client.send(describeCommand);
          status = describeResult.Status;
          if (status === 'FAILED' || status === 'ABORTED') {
            throw new Error(`Query execution failed with status: ${status}`);
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        const getResultCommand = new GetStatementResultCommand({ Id: executeResult.Id });
        const results = await client.send(getResultCommand);

        return {
          status: 'ok',
          data: results.Records,
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

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    const input = {
      Sql: 'SELECT 1',
      SecretArn: sourceOptions.secretARN,
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

  async getConnection(sourceOptions: SourceOptions): Promise<RedshiftDataClient> {
    const credentials = {
      accessKeyId: sourceOptions.access_key,
      secretAccessKey: sourceOptions.secret_key,
    };
    const client = new RedshiftDataClient({ region: sourceOptions.region, credentials });
    return client;
  }
}
