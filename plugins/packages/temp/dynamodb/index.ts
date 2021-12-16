import { Injectable } from '@nestjs/common';
import { ConnectionTestResult } from 'src/modules/data_sources/connection_test_result.type';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { deleteItem, getItem, listTables, queryTable, scanTable } from './operations';
const AWS = require('aws-sdk');

@Injectable()
export default class DynamodbQueryService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
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
          result = await queryTable(client, JSON.parse(queryOptions['query_condition']));
          break;
        case 'scan_table':
          result = await scanTable(client, JSON.parse(queryOptions['scan_condition']));
          break;
      }
    } catch (err) {
      console.log(err);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: object): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions, { operation: 'list_tables' });
    await listTables(client);

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: any, options?: object): Promise<any> {
    const credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
    const region = sourceOptions['region'];

    if (options['operation'] == 'list_tables') {
      return new AWS.DynamoDB({ region, credentials });
    } else {
      return new AWS.DynamoDB.DocumentClient({ region, credentials });
    }
  }
}
