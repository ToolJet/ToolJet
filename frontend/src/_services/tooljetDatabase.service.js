import HttpClient from '@/_helpers/http-client';
import { handleUnSubscription } from '../_helpers/utils';
import { authenticationService } from '@/_services';

const tooljetAdapter = new HttpClient();
let organizationId;

const subsciption = authenticationService.currentOrganization.subscribe((newOrgDetails) => {
  if (newOrgDetails.current_organization_id) {
    organizationId = newOrgDetails.current_organization_id;
  }
});

handleUnSubscription(subsciption);

function findOne(tableName, query = '') {
  return tooljetAdapter.get(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}?${query}`);
}

function findAll() {
  return tooljetAdapter.get(`/tooljet_db/organizations/${organizationId}/tables`);
}

function createTable(tableName, columns) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/table`, {
    table_name: tableName,
    columns,
  });
}

function viewTable(tableName) {
  return tooljetAdapter.get(`/tooljet_db/organizations/${organizationId}/table/${tableName}`);
}

function createRow(tableName, data) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}`, data);
}

function createColumn(tableName, columnName, dataType, defaultValue) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/table/${tableName}/column`, {
    column: {
      column_name: columnName,
      data_type: dataType,
      default: defaultValue,
    },
  });
}

function updateTable(tableName, columns) {
  return tooljetAdapter.patch(`/tooljet_db/${organizationId}/perform`, {
    action: 'update_table',
    table_name: tableName,
    columns,
  });
}

function renameTable(tableName, newTableName) {
  return tooljetAdapter.patch(`/tooljet_db/organizations/${organizationId}/table/${tableName}`, {
    action: 'rename_table',
    table_name: tableName,
    new_table_name: newTableName,
  });
}

function updateRows(tableName, data, query = '') {
  return tooljetAdapter.patch(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}?${query}`, data);
}

function deleteRow(tableName, query = '') {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}?${query}`);
}

function deleteColumn(tableName, columnName) {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/table/${tableName}/column/${columnName}`);
}

function deleteTable(tableName) {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/table/${tableName}`);
}

export const tooljetDatabaseService = {
  findOne,
  findAll,
  viewTable,
  createRow,
  createTable,
  createColumn,
  updateTable,
  updateRows,
  deleteRow,
  deleteColumn,
  deleteTable,
  renameTable,
};
