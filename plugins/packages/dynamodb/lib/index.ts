import { ConnectionTestResult, QueryService, QueryResult, QueryError } from '@tooljet-plugins/common';
import {
  deleteItem,
  getItem,
  listTables,
  queryTable,
  scanTable,
  describeTable,
  updateItem,
  createTable,
  putItem,
} from './operations';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { STSClient, AssumeRoleCommand, AssumeRoleCommandOutput } from '@aws-sdk/client-sts';
import { fromInstanceMetadata } from '@aws-sdk/credential-providers';
import { AssumeRoleCredentials, SourceOptions, QueryOptions } from './types';

export default class DynamodbQueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const client = await this.getConnection(sourceOptions, { operation });
    let result = {};

    try {
      switch (operation) {
        case 'list_tables':
          result = await listTables(client);
          break;
        case 'get_item':
          result = await getItem(client, queryOptions.table, JSON.parse(queryOptions.key));
          break;
        case 'delete_item':
          result = await deleteItem(client, queryOptions.table, JSON.parse(queryOptions.key));
          break;
        case 'query_table':
          result = await queryTable(client, JSON.parse(queryOptions.query_condition));
          break;
        case 'scan_table':
          result = await scanTable(client, JSON.parse(queryOptions.scan_condition));
          break;
        case 'update_item':
          result = await updateItem(client, JSON.parse(queryOptions.update_condition));
          break;
        case 'create_table':
          result = await createTable(client, JSON.parse(queryOptions.table_parameters));
          break;
        case 'describe_table':
          result = await describeTable(client, queryOptions.table);
          break;
        case 'put_item':
          result = await putItem(client, JSON.parse(queryOptions.new_item_details));
          break;
      }
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions, { operation: 'list_tables' });
    await listTables(client);

    return {
      status: 'ok',
    };
  }

  async getAssumeRoleCredentials(roleArn: string, region: string): Promise<AssumeRoleCredentials> {
    const stsClient = new STSClient({ region });

    const timestamp = new Date().getTime();
    const roleName = roleArn.split('/')[1];

    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `dynamodb-${roleName}-${timestamp}`,
    });

    try {
      const data: AssumeRoleCommandOutput = await stsClient.send(command);

      return {
        accessKeyId: data.Credentials?.AccessKeyId,
        secretAccessKey: data.Credentials?.SecretAccessKey,
        sessionToken: data.Credentials?.SessionToken,
      };
    } catch (err) {
      throw new Error(`Failed to assume role: ${err.message}`);
    }
  }

  async getConnection(sourceOptions: SourceOptions, options?: { operation: string }): Promise<any> {
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';
    const region = sourceOptions['region'];
    const useRoleArn = sourceOptions['instance_metadata_credentials'] === 'aws_arn_role';

    let credentials;

    if (useAWSInstanceProfile) {
      // Use EC2 instance metadata credentials
      credentials = fromInstanceMetadata({
        timeout: 5000,
        maxRetries: 1,
      });
    } else if (useRoleArn) {
      // Assume role and use temporary credentials
      const assumeRoleCredentials = await this.getAssumeRoleCredentials(sourceOptions['role_arn'], region);
      credentials = {
        accessKeyId: assumeRoleCredentials.accessKeyId,
        secretAccessKey: assumeRoleCredentials.secretAccessKey,
        sessionToken: assumeRoleCredentials.sessionToken,
      };
    } else {
      // Use explicit access key and secret key
      credentials = {
        accessKeyId: sourceOptions['access_key'],
        secretAccessKey: sourceOptions['secret_key'],
      };
    }

    // Create base DynamoDB client
    const dynamoDBClient = new DynamoDBClient({
      region,
      credentials,
    });

    // For operations that need the low-level client (create_table, list_tables, describe_table)
    if (options?.operation && ['create_table', 'list_tables', 'describe_table'].includes(options.operation)) {
      return dynamoDBClient;
    } else {
      // For document operations, wrap with DynamoDBDocumentClient
      return DynamoDBDocumentClient.from(dynamoDBClient, {
        marshallOptions: {
          // Whether to automatically convert empty strings, blobs, and sets to `null`
          convertEmptyValues: false,
          // Whether to remove undefined values while marshalling
          removeUndefinedValues: true,
          // Whether to convert typeof object to map attribute
          convertClassInstanceToMap: false,
        },
        unmarshallOptions: {
          // Whether to return numbers as a string instead of converting them to native JavaScript numbers
          wrapNumbers: false,
        },
      });
    }
  }
}
