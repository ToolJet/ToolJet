import { tooljetDatabaseService, authenticationService } from '@/_services';
import { isEmpty } from 'lodash';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { resolveReferences } from '@/_helpers/utils';
import { hasEmptyStringOrNullValue } from './util';

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
    case 'join_tables':
      return joinTables(dataQuery, currentState);

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
  if (hasEmptyStringOrNullValue(resolvedOptions, 'list_rows')) {
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
  if (hasEmptyStringOrNullValue(resolvedOptions, 'update_rows')) {
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
  if (hasEmptyStringOrNullValue(resolvedOptions, 'delete_rows')) {
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

// Function:- To valid Empty fields in JSON ( Works for Nested JSON too )
// function validateInputJsonHasEmptyFields(input) {
//   let isValid = true;

//   if (isEmpty(input)) return false;
//   if (Array.isArray(input)) {
//     let isIncludesInvalidJson = input
//       .map((eachValue) => {
//         let isValidJson = validateInputJsonHasEmptyFields(eachValue);
//         return isValidJson;
//       })
//       .includes(false);
//     if (isIncludesInvalidJson) isValid = false;
//   }

//   if (typeof input === 'object') {
//     let isIncludesInvalidJson = Object.entries(input)
//       .map(([key, value]) => {
//         let isValidJson = validateInputJsonHasEmptyFields(value);
//         return isValidJson;
//       })
//       .includes(false);
//     if (isIncludesInvalidJson) isValid = false;
//   }

//   return isValid;
// }

async function joinTables(dataQuery, currentState) {
  const organizationId = authenticationService.currentSessionValue.current_organization_id;
  const queryOptions = dataQuery.options;
  const resolvedOptions = resolveReferences(queryOptions, currentState);
  const { join_table = {} } = resolvedOptions;

  // Empty Input is restricted
  if (Object.keys(join_table).length === 0) {
    return {
      status: 'failed',
      statusText: 'failed',
      message: `Input can't be empty`,
      description: 'Empty inputs are not allowed',
      data: {},
    };
  }

  const sanitizedJoinTableJson = { ...join_table };
  // If mandatory fields ( Select, JOin & From section ), are empty throw error
  let mandatoryFieldsButEmpty = [];
  if (!sanitizedJoinTableJson?.fields.length) mandatoryFieldsButEmpty.push('Select');
  if (sanitizedJoinTableJson?.from && !Object.keys(sanitizedJoinTableJson?.from).length)
    mandatoryFieldsButEmpty.push('From');
  // if (join_table?.joins && !validateInputJsonHasEmptyFields(join_table?.joins)) mandatoryFieldsButEmpty.push('Joins');
  if (mandatoryFieldsButEmpty.length) {
    return {
      status: 'failed',
      statusText: 'failed',
      message: `Empty values are found in the following section - ${mandatoryFieldsButEmpty.join(', ')}.`,
      description: 'Mandatory fields are not empty',
      data: {},
    };
  }

  // If non-mandatory fields ( Filter & Sort ) are empty - remove the particular field
  if (
    sanitizedJoinTableJson?.conditions &&
    (!Object.keys(sanitizedJoinTableJson?.conditions)?.length ||
      !sanitizedJoinTableJson?.conditions?.conditionsList?.length)
  ) {
    delete sanitizedJoinTableJson.conditions;
  }
  if (sanitizedJoinTableJson?.order_by && !sanitizedJoinTableJson?.order_by.length)
    delete sanitizedJoinTableJson.order_by;

  return await tooljetDatabaseService.joinTables(organizationId, sanitizedJoinTableJson);
}
