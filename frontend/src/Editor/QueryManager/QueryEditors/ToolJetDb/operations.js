import { tooljetDatabaseService } from "@/_services";
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';

export const tooljetDbOperations = {
  perform
};

async function perform(organizationId, queryOptions) {
  switch(queryOptions.operation) {
  case 'list_rows':
    return await listRows(organizationId, queryOptions)
  }
}

async function listRows(organization_id, options) {
  const {
    table_name,
    limit,
    where_operation,
    where_field,
    where_value,
    order_field,
    order_type,
  } = options;
  let query = "";


  return await tooljetDatabaseService.findOne(
    organization_id,
    table_name,
    query
  );
}

async function createRow(organization_id, options) {
  return await tooljetDatabaseService.createRow(
    organization_id,
    table_name,
    body
  );
}

async function updateRow(organization_id, options) {
  return await tooljetDatabaseService.createRow(
    organization_id,
    table_name,
    body
  );
}

async function deleteRow(organization_id, options) {
  return await tooljetDatabaseService.deleteRow(
    organization_id,
    table_name,
    query
  );
}

async function listTables(organization_id, options) {
  return await tooljetDatabaseService.findAll(organization_id);
}
