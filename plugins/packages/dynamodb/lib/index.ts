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
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { STSClient, AssumeRoleCommand, AssumeRoleCommandOutput } from '@aws-sdk/client-sts';
import { fromInstanceMetadata } from '@aws-sdk/credential-providers';
import { AssumeRoleCredentials, SourceOptions, QueryOptions } from './types';


// JSON.parse turns Buffer/Uint8Array into {type:'Buffer',data:[...]} which DynamoDB
// marshals as Map (M) instead of Binary (B). Recursively restore those to Uint8Array.
function convertBuffers(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object' && !Array.isArray(value) && value.type === 'Buffer' && Array.isArray(value.data)) {
    return new Uint8Array(value.data);
  }
  if (Array.isArray(value)) return value.map(convertBuffers);
  if (typeof value === 'object') {
    const result: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = convertBuffers(value[key]);
      }
    }
    return result;
  }
  return value;
}

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
        case 'get_item': {
          const extraParams = this.parseExpressionAttributeValues(queryOptions.expression_attribute_values);
          result = await getItem(client, queryOptions.table, convertBuffers(JSON.parse(queryOptions.key)), extraParams);
          break;
        }
        case 'delete_item': {
          const extraParams = this.parseExpressionAttributeValues(queryOptions.expression_attribute_values);
          result = await deleteItem(
            client,
            queryOptions.table,
            convertBuffers(JSON.parse(queryOptions.key)),
            extraParams
          );
          break;
        }
        case 'query_table': {
          const condition = convertBuffers(JSON.parse(queryOptions.query_condition || '{}'));
          if (queryOptions.table) condition.TableName = queryOptions.table;
          this.mergeExpressionAttributeValues(condition, queryOptions.expression_attribute_values);
          result = await queryTable(client, condition);
          break;
        }
        case 'scan_table': {
          const condition = convertBuffers(JSON.parse(queryOptions.scan_condition || '{}'));
          if (queryOptions.table) condition.TableName = queryOptions.table;
          this.mergeExpressionAttributeValues(condition, queryOptions.expression_attribute_values);
          result = await scanTable(client, condition);
          break;
        }
        case 'update_item': {
          const condition = convertBuffers(JSON.parse(queryOptions.update_condition || '{}'));
          if (queryOptions.table) condition.TableName = queryOptions.table;
          this.mergeExpressionAttributeValues(condition, queryOptions.expression_attribute_values);
          result = await updateItem(client, condition);
          break;
        }
        case 'create_table':
          result = await createTable(client, convertBuffers(JSON.parse(queryOptions.table_parameters)));
          break;
        case 'describe_table':
          result = await describeTable(client, queryOptions.table);
          break;
        case 'put_item': {
          const details = convertBuffers(JSON.parse(queryOptions.new_item_details || '{}'));
          if (queryOptions.table) details.TableName = queryOptions.table;
          this.mergeExpressionAttributeValues(details, queryOptions.expression_attribute_values);
          result = await putItem(client, details);
          break;
        }
      }
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  private buildExpressionAttributeValues(pairs?: [string, string][]): Record<string, any> {
    if (!pairs || pairs.length === 0) return {};
    const result: Record<string, any> = {};
    for (const [key, value] of pairs) {
      if (!key) continue;
      let parsed: any;
      try {
        parsed = JSON.parse(value);
      } catch {
        parsed = value;
      }
      result[key] = convertBuffers(parsed);
    }
    return result;
  }

  private parseExpressionAttributeValues(pairs?: [string, string][]): Record<string, any> {
    const values = this.buildExpressionAttributeValues(pairs);
    if (Object.keys(values).length === 0) return {};
    return { ExpressionAttributeValues: values };
  }

  private mergeExpressionAttributeValues(condition: any, pairs?: [string, string][]): void {
    const values = this.buildExpressionAttributeValues(pairs);
    if (Object.keys(values).length === 0) return;
    condition.ExpressionAttributeValues = {
      ...(condition.ExpressionAttributeValues || {}),
      ...values,
    };
  }

  async invokeMethod(methodName: string, _context: unknown, sourceOptions: SourceOptions, args?: any): Promise<unknown> {
    if (methodName === 'listTables') {
      const client = await this.getConnection(sourceOptions, { operation: 'list_tables' });
      return await this._listAllTables(client, args);
    }
    throw new QueryError('Method not found', `Method '${methodName}' is not supported by the DynamoDB plugin`, {});
  }

  private async _listAllTables(
    client: DynamoDBClient,
    args?: any
  ): Promise<{ items: Array<{ value: string; label: string }>; totalCount: number }> {
    const tables: string[] = [];
    let lastEvaluatedTableName: string | undefined;

    try {
      do {
        const command = new ListTablesCommand({ ExclusiveStartTableName: lastEvaluatedTableName, Limit: 100 });
        const data = await client.send(command);
        tables.push(...(data.TableNames || []));
        lastEvaluatedTableName = data.LastEvaluatedTableName;
      } while (lastEvaluatedTableName);
    } catch (err) {
      throw new QueryError('Could not fetch tables', err.message, {});
    }

    const search = (args?.search || '').toLowerCase();
    const filtered = search ? tables.filter((name) => name.toLowerCase().includes(search)) : tables;

    const page = args?.page || 1;
    const limit = args?.limit;

    if (limit) {
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit).map((name) => ({ value: name, label: name })),
        totalCount: filtered.length,
      };
    }

    return {
      items: filtered.map((name) => ({ value: name, label: name })),
      totalCount: filtered.length,
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
