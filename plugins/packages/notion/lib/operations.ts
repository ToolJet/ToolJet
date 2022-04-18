import { QueryOptions } from './types';
import { Client } from '@notionhq/client';
const JSON5 = require('json5');

function returnObject(data: any) {
  if (!data) {
    return undefined;
  }
  return typeof data === 'string' ? JSON5.parse(data) : data;
}

function returnNumber(data: any) {
  if (!data) {
    return undefined;
  }
  return typeof data === 'string' ? Number.parseInt(data) : data;
}

export async function databaseOperations(notion: Client, queryOptions: QueryOptions, operation: string) {
  switch (operation) {
    case 'get_database': {
      const { database_id } = queryOptions;
      return await notion.databases.retrieve({
        database_id,
      });
    }
    case 'query_database': {
      const { database_id, filter, sorts, limit } = queryOptions;
      return await notion.databases.query({
        database_id,
        filter: returnObject(filter),
        sorts: returnObject(sorts),
        page_size: returnNumber(limit),
      });
    }
    default:
      throw Error('Invalid operation');
  }
}

export async function pageOperations(notion: Client, queryOptions: QueryOptions, operation: string) {
  switch (operation) {
    case 'get_page': {
      const { page_id } = queryOptions;
      return await notion.pages.retrieve({
        page_id,
      });
    }
    default:
      throw Error('Invalid operation');
  }
}
