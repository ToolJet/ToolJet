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

function returnImgObject(type: string, value: string): any {
  if (type === 'external' && value) {
    return {
      type: 'external',
      external: {
        url: value,
      },
    };
  } else if (type === 'emoji' && value) {
    return {
      type: 'emoji',
      emoji: value,
    };
  } else {
    return undefined;
  }
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
      const { database_id, filter, sorts, limit, start_cursor } = queryOptions;
      return await notion.databases.query({
        database_id,
        filter: returnObject(filter),
        sorts: returnObject(sorts),
        page_size: returnNumber(limit),
        start_cursor: start_cursor !== '' || start_cursor ? start_cursor : undefined,
      });
    }
    case 'create_database': {
      const { page_id, title, properties, cover_type, cover_value, icon_type, icon_value } = queryOptions;
      return await notion.databases.create({
        parent: { page_id },
        title: returnObject(title),
        properties: returnObject(properties),
        cover: returnImgObject(cover_type, cover_value),
        icon: returnImgObject(icon_type, icon_value),
      });
    }
    case 'update_database': {
      const { database_id, title, properties, cover_type, cover_value, icon_type, icon_value } = queryOptions;
      return await notion.databases.update({
        database_id,
        title: returnObject(title),
        properties: returnObject(properties),
        cover: returnImgObject(cover_type, cover_value),
        icon: returnImgObject(icon_type, icon_value),
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
      const {
        parent_type,
        page_id,
        database_id,
        properties,
        children,
        icon_type,
        icon_value,
        cover_type,
        cover_value,
      } = queryOptions;
      return await notion.pages.create({
        parent: {
          type: parent_type,
          database_id: parent_type === 'database_id' ? database_id : undefined,
          page_id: parent_type === 'page_id' ? page_id : undefined,
        },
        properties: returnObject(properties),
        children: returnObject(children),
        icon: returnImgObject(icon_type, icon_value),
        cover: returnImgObject(cover_type, cover_value),
      });
    }
    case 'update_page': {
      const { page_id, properties, icon_type, icon_value, cover_type, cover_value } = queryOptions;
      return await notion.pages.update({
        page_id,
        properties: returnObject(properties),
        icon: returnImgObject(icon_type, icon_value),
        cover: returnImgObject(cover_type, cover_value),
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
      const { page_id, property_id, limit, start_cursor } = queryOptions;
      return await notion.pages.properties.retrieve({
        page_id,
        property_id,
        page_size: returnNumber(limit),
        start_cursor: start_cursor !== '' || start_cursor ? start_cursor : undefined,
      });
    }
    default:
      throw Error('Invalid operation');
  }
}

export async function blockOperations(notion: Client, queryOptions: QueryOptions, operation: string) {
  switch (operation) {
    case 'get_block': {
      const { block_id } = queryOptions;
      return await notion.blocks.retrieve({
        block_id,
      });
    }
    case 'update_block': {
      const { block_id, properties, archived } = queryOptions;
      return await notion.blocks.update({
        block_id,
        archived: archived ?? undefined,
        ...returnObject(properties),
      });
    }
    case 'get_block_children': {
      const { block_id, limit, start_cursor } = queryOptions;
      return await notion.blocks.children.list({
        block_id,
        start_cursor: start_cursor !== '' || start_cursor ? start_cursor : undefined,
        page_size: returnNumber(limit),
      });
    }
    case 'append_block_children': {
      const { block_id, children } = queryOptions;
      return await notion.blocks.children.append({
        block_id,
        children: returnObject(children),
      });
    }
    case 'delete_block': {
      const { block_id } = queryOptions;
      return await notion.blocks.delete({
        block_id,
      });
    }
    default:
      throw Error('Invalid operation');
  }
}

export async function userOperations(notion: Client, queryOptions: QueryOptions, operation: string) {
  switch (operation) {
    case 'get_user': {
      const { user_id } = queryOptions;
      return await notion.users.retrieve({
        user_id,
      });
    }
    case 'list_users': {
      const { limit, start_cursor } = queryOptions;
      return await notion.users.list({
        start_cursor: start_cursor !== '' || start_cursor ? start_cursor : undefined,
        page_size: returnNumber(limit),
      });
    }
    default:
      throw Error('Invalid operation');
  }
}
