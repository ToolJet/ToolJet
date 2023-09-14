import HttpClient from '@/_helpers/http-client';

const tooljetAdapter = new HttpClient();

function findOne(headers, tableId, query = '') {
  tooljetAdapter.headers = { ...tooljetAdapter.headers, ...headers };
  return tooljetAdapter.get(`/tooljet_db/proxy/${tableId}?${query}`, headers);
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

function createRow(headers, tableId, data) {
  return tooljetAdapter.post(`/tooljet_db/proxy/${tableId}`, data, headers);
}

function createColumn(organizationId, tableId, columnName, dataType, defaultValue) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/table/${tableId}/column`, {
    column: {
      column_name: columnName,
      data_type: dataType,
      column_default: defaultValue,
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

function updateRows(headers, tableId, data, query = '') {
  return tooljetAdapter.patch(`/tooljet_db/proxy/${tableId}?${query}`, data, headers);
}

function deleteRows(headers, tableId, query = '') {
  return tooljetAdapter.delete(`/tooljet_db/proxy/${tableId}?${query}`, headers);
}

function deleteColumn(organizationId, tableName, columnName) {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/table/${tableName}/column/${columnName}`);
}

function deleteTable(organizationId, tableName) {
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
  deleteRows,
  deleteColumn,
  deleteTable,
  renameTable,
};
