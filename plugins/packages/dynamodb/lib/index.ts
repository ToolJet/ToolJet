import { ConnectionTestResult, QueryService, QueryResult, QueryError } from '@tooljet-plugins/common';

import { deleteItem, getItem, listTables, queryTable, scanTable } from './operations';
const AWS = require('aws-sdk');
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
      }
    } catch (err) {
      console.log(err);
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
  // todo
  async getAssumeRoleCredentials(roleArn: string, iamCredentials?: object): Promise<AssumeRoleCredentials> {
    const sts = iamCredentials ? new AWS.STS({ credentials: iamCredentials }) : new AWS.STS();

    return new Promise((resolve, reject) => {
      const timestamp = new Date().getTime();
      const roleName = roleArn.split('/')[1];
      const params = {
        RoleArn: roleArn,
        RoleSessionName: `dynamodb-${roleName}-${timestamp}`,
      };

      sts.assumeRole(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken,
          });
        }
      });
    });
  }

  async getConnection(sourceOptions: SourceOptions, options?: object): Promise<any> {
    const useAWSInstanceProfile = sourceOptions['instance_metadata_credentials'] === 'aws_instance_credentials';

    let credentials = null;
    if (useAWSInstanceProfile) {
      credentials = new AWS.EC2MetadataCredentials({ httpOptions: { timeout: 5000 } });
    } else {
      credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
    }

    const region = sourceOptions['region'];

    if (options['operation'] == 'list_tables') {
      return new AWS.DynamoDB({ region, credentials });
    } else {
      return new AWS.DynamoDB.DocumentClient({ region, credentials });
    }
  }
}
