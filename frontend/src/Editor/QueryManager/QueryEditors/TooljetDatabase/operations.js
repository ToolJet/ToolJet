import { tooljetDatabaseService } from '@/_services';
import { isEmpty } from 'lodash';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { resolveReferences } from '@/_helpers/utils';
import { hasEqualWithNull } from './util';

export const tooljetDbOperations = {
  perform,
};

async function perform(dataQuery, currentState) {
  switch (dataQuery.options.operation) {
    case 'list_rows':
      return listRows(dataQuery, currentState);
    case 'create_row':
      return createRow(dataQuery, currentState);
    case 'update_rows':
      return updateRows(dataQuery, currentState);
    case 'delete_rows':
      return deleteRows(dataQuery, currentState);

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

async function listRows(dataQuery, currentState) {
  const queryOptions = dataQuery.options;
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
  const { table_id: tableId, list_rows: listRows } = resolvedOptions;
  let query = [];

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
  const headers = { 'data-query-id': dataQuery.id };
  return await tooljetDatabaseService.findOne(headers, tableId, query.join('&'));
}

async function createRow(dataQuery, currentState) {
  const queryOptions = dataQuery.options;
  const resolvedOptions = resolveReferences(queryOptions, currentState);
  const columns = Object.values(resolvedOptions.create_row).reduce((acc, colOpts) => {
    if (isEmpty(colOpts.column)) return acc;
    return { ...acc, ...{ [colOpts.column]: colOpts.value } };
  }, {});
  const headers = { 'data-query-id': dataQuery.id };
  return await tooljetDatabaseService.createRow(headers, resolvedOptions.table_id, columns);
}

async function updateRows(dataQuery, currentState) {
  const queryOptions = dataQuery.options;
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
  const { table_id: tableId, update_rows: updateRows } = resolvedOptions;
  const { where_filters: whereFilters, columns } = updateRows;

  let query = [];
  const whereQuery = buildPostgrestQuery(whereFilters);
  const body = Object.values(columns).reduce((acc, colOpts) => {
    if (isEmpty(colOpts.column)) return acc;
    return { ...acc, ...{ [colOpts.column]: colOpts.value } };
  }, {});

  !isEmpty(whereQuery) && query.push(whereQuery);

  const headers = { 'data-query-id': dataQuery.id };
  return await tooljetDatabaseService.updateRows(headers, tableId, body, query.join('&') + '&order=id');
}

async function deleteRows(dataQuery, currentState) {
  const queryOptions = dataQuery.options;
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
  const { table_id: tableId, delete_rows: deleteRows = { whereFilters: {} } } = resolvedOptions;
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

  const headers = { 'data-query-id': dataQuery.id };
  return await tooljetDatabaseService.deleteRows(headers, tableId, query.join('&'));
}
