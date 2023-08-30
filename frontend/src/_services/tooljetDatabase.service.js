import HttpClient from '@/_helpers/http-client';

const tooljetAdapter = new HttpClient();

function findOne(organizationId, tableName, query = '') {
  return tooljetAdapter.get(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}?${query}`);
}

function findAll(organizationId) {
  return tooljetAdapter.get(`/tooljet_db/organizations/${organizationId}/tables`);
}

function createTable(organizationId, tableName, columns) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/table`, {
    table_name: tableName,
    columns,
  });
}

function viewTable(organizationId, tableName) {
  return tooljetAdapter.get(`/tooljet_db/organizations/${organizationId}/table/${tableName}`);
}

function createRow(organizationId, tableName, data) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}`, data);
}

function createColumn(organizationId, tableName, columnName, dataType, defaultValue) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/table/${tableName}/column`, {
    column: {
      column_name: columnName,
      data_type: dataType,
      default: defaultValue,
    },
  });
}

function updateTable(organizationId, tableName, columns) {
  return tooljetAdapter.patch(`/tooljet_db/${organizationId}/perform`, {
    action: 'update_table',
    table_name: tableName,
    columns,
  });
}

function renameTable(organizationId, tableName, newTableName) {
  return tooljetAdapter.patch(`/tooljet_db/organizations/${organizationId}/table/${tableName}`, {
    action: 'rename_table',
    table_name: tableName,
    new_table_name: newTableName,
  });
}

function updateRows(organizationId, tableName, data, query = '') {
  return tooljetAdapter.patch(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}?${query}`, data);
}

function deleteRow(organizationId, tableName, query = '') {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/proxy/\${${tableName}}?${query}`);
}

function deleteColumn(organizationId, tableName, columnName) {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/table/${tableName}/column/${columnName}`);
}

function deleteTable(organizationId, tableName) {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/table/${tableName}`);
}

function joinTables(organizationId, data) {
  return tooljetAdapter.post(`tooljet_db/organizations/${organizationId}/getDetailsOnJoin`, data);
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
  joinTables,
};
