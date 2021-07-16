import { Injectable } from '@nestjs/common';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import { deleteItem, getItem, listTables, queryTable, scanTable } from './operations';
var AWS = require("aws-sdk");

@Injectable()
export default class DynamodbQueryService implements QueryService {

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    const credentials = new AWS.Credentials(sourceOptions['access_key'], sourceOptions['secret_key']);
    const region = sourceOptions['region'];

    let client = {};

    let result = { };
    const operation = queryOptions.operation;

    try {
      
      switch (operation) {
        case 'list_tables':
          client = new AWS.DynamoDB({ region, credentials });
          result = await listTables(client);
          break;  
        case 'get_item':
          client = new AWS.DynamoDB.DocumentClient({ region, credentials });
          result = await getItem(client, queryOptions.table, JSON.parse(queryOptions.key));
          break;
        case 'delete_item':
          client = new AWS.DynamoDB.DocumentClient({ region, credentials });
          result = await deleteItem(client, queryOptions.table, JSON.parse(queryOptions.key));
          break;  
        case 'query_table':
          client = new AWS.DynamoDB.DocumentClient({ region, credentials });
          result = await queryTable(client, JSON.parse(queryOptions['query_condition']));
          break; 
        case 'scan_table':
          client = new AWS.DynamoDB.DocumentClient({ region, credentials });
          result = await scanTable(client, JSON.parse(queryOptions['scan_condition']));
          break;   
      }
    } catch (err) {
      console.log(err);
    }

    return {
      status: 'ok',
      data: result
    }
  }
}
