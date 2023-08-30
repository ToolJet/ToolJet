import { tooljetDatabaseService } from '@/_services';
import { isEmpty } from 'lodash';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { resolveReferences } from '@/_helpers/utils';
import { hasEqualWithNull } from './util';

export const tooljetDbOperations = {
  perform,
};

async function perform(queryOptions, organizationId, currentState) {
  switch (queryOptions.operation) {
    case 'list_rows':
      return listRows(queryOptions, organizationId, currentState);
    case 'create_row':
      return createRow(queryOptions, organizationId, currentState);
    case 'update_rows':
      return updateRows(queryOptions, organizationId, currentState);
    case 'delete_rows':
      return deleteRows(queryOptions, organizationId, currentState);
    case 'join_tables':
      return joinTables(queryOptions, organizationId, currentState);

    default:
      return {
        statusText: 'Bad Request',
        status: 400,
        data: {},
        error: {
          message: 'Invalid operation',
        },
      };
  }
}

function buildPostgrestQuery(filters) {
  if (isEmpty(filters)) return null;

  const postgrestQueryBuilder = new PostgrestQueryBuilder();

  Object.keys(filters).map((key) => {
    if (!isEmpty(filters[key])) {
      const { column, operator, value, order } = filters[key];

      if (!isEmpty(column) && !isEmpty(order)) {
        postgrestQueryBuilder.order(column, order);
      }

      if (!isEmpty(column) && !isEmpty(operator) && value && value !== '') {
        postgrestQueryBuilder[operator](column, value.toString());
      }
    }
  });
  return postgrestQueryBuilder.url.toString();
}

async function listRows(queryOptions, organizationId, currentState) {
  let query = [];
  const resolvedOptions = resolveReferences(queryOptions, currentState);
  if (hasEqualWithNull(resolvedOptions, 'list_rows')) {
    return {
      status: 'failed',
      statusText: 'failed',
      message: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
      description: 'Is operator should be used with null value comparision.',
      data: {},
    };
  }
  const { table_name: tableName, list_rows: listRows } = resolvedOptions;

  if (!isEmpty(listRows)) {
    const { limit, where_filters: whereFilters, order_filters: orderFilters } = listRows;

    if (limit && isNaN(limit)) {
      return {
        status: 'failed',
        statusText: 'failed',
        message: 'Please provide a valid limit',
        description: 'Limit should be a number',
        data: {},
      };
    }

    const whereQuery = buildPostgrestQuery(whereFilters);
    const orderQuery = buildPostgrestQuery(orderFilters);

    !isEmpty(whereQuery) && query.push(whereQuery);
    !isEmpty(orderQuery) && query.push(orderQuery);
    !isEmpty(limit) && query.push(`limit=${limit}`);
  }
  return await tooljetDatabaseService.findOne(organizationId, tableName, query.join('&'));
}

async function createRow(queryOptions, organizationId, currentState) {
  const resolvedOptions = resolveReferences(queryOptions, currentState);
  const columns = Object.values(resolvedOptions.create_row).reduce((acc, colOpts) => {
    if (isEmpty(colOpts.column)) return acc;
    return { ...acc, ...{ [colOpts.column]: colOpts.value } };
  }, {});
  return await tooljetDatabaseService.createRow(organizationId, resolvedOptions.table_name, columns);
}

async function updateRows(queryOptions, organizationId, currentState) {
  const resolvedOptions = resolveReferences(queryOptions, currentState);
  if (hasEqualWithNull(resolvedOptions, 'update_rows')) {
    return {
      status: 'failed',
      statusText: 'failed',
      message: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
      description: 'Is operator should be used with null value comparision.',
      data: {},
    };
  }
  const { table_name: tableName, update_rows: updateRows } = resolvedOptions;
  const { where_filters: whereFilters, columns } = updateRows;

  let query = [];
  const whereQuery = buildPostgrestQuery(whereFilters);
  const body = Object.values(columns).reduce((acc, colOpts) => {
    if (isEmpty(colOpts.column)) return acc;
    return { ...acc, ...{ [colOpts.column]: colOpts.value } };
  }, {});

  !isEmpty(whereQuery) && query.push(whereQuery);

  return await tooljetDatabaseService.updateRows(organizationId, tableName, body, query.join('&') + '&order=id');
}

async function deleteRows(queryOptions, organizationId, currentState) {
  const resolvedOptions = resolveReferences(queryOptions, currentState);
  if (hasEqualWithNull(resolvedOptions, 'delete_rows')) {
    return {
      status: 'failed',
      statusText: 'failed',
      message: 'Null value comparison not allowed, To check null values Please use IS operator instead.',
      description: 'Is operator should be used with null value comparision.',
      data: {},
    };
  }
  const { table_name: tableName, delete_rows: deleteRows = { whereFilters: {} } } = resolvedOptions;
  const { where_filters: whereFilters, limit = 1 } = deleteRows;

  let query = [];
  const whereQuery = buildPostgrestQuery(whereFilters);
  if (isEmpty(whereQuery)) {
    return {
      status: 'failed',
      statusText: 'failed',
      message: 'Please provide a where filter or a limit to delete rows',
      description: 'Please provide a where filter or a limit to delete rows',
      data: {},
    };
  }

  if (limit && isNaN(limit)) {
    return {
      status: 'failed',
      statusText: 'failed',
      message: 'Please provide a valid limit',
      description: 'Limit should be a number',
      data: {},
    };
  }

  !isEmpty(whereQuery) && query.push(whereQuery);
  limit && limit !== '' && query.push(`limit=${limit}&order=id`);

  return await tooljetDatabaseService.deleteRow(organizationId, tableName, query.join('&'));
}

async function joinTables(queryOptions, organizationId, currentState) {
  const resolvedOptions = resolveReferences(queryOptions, currentState);
  // Check and Remove Empty options, Before sending a API
  const { join_table = {} } = resolvedOptions;
  return await tooljetDatabaseService.joinTables(organizationId, join_table);
}
