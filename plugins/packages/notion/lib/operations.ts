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
    case 'create_database': {
      const { page_id, title, properties, cover_obj, icon_obj } = queryOptions;
      return await notion.databases.create({
        parent: { page_id },
        title: returnObject(title),
        properties: returnObject(properties),
        cover: returnObject(cover_obj),
        icon: returnObject(icon_obj),
      });
    }
    case 'update_database': {
      const { database_id, title, properties, cover_obj, icon_obj } = queryOptions;
      return await notion.databases.update({
        database_id,
        title: returnObject(title),
        properties: returnObject(properties),
        cover: returnObject(cover_obj),
        icon: returnObject(icon_obj),
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
    case 'create_page': {
      const { parent_type, page_id, database_id, properties, children, icon_obj, cover_obj } = queryOptions;
      return await notion.pages.create({
        parent: {
          type: parent_type,
          database_id: parent_type === 'database_id' ? database_id : undefined,
          page_id: parent_type === 'page_id' ? page_id : undefined,
        },
        properties: returnObject(properties),
        children: returnObject(children),
        icon: returnObject(icon_obj),
        cover: returnObject(cover_obj),
      });
    }
    case 'update_page': {
      const { page_id, properties, icon_obj, cover_obj } = queryOptions;
      return await notion.pages.update({
        page_id,
        properties: returnObject(properties),
        icon: returnObject(icon_obj),
        cover: returnObject(cover_obj),
      });
    }
    case 'archive_page': {
      const { page_id, archived } = queryOptions;
      return await notion.pages.update({
        page_id,
        archived,
      });
    }
    case 'get_page_property': {
      const { page_id, property_id, limit } = queryOptions;
      return await notion.pages.properties.retrieve({
        page_id,
        property_id,
        page_size: returnNumber(limit),
      });
    }
    default:
      throw Error('Invalid operation');
  }
}
