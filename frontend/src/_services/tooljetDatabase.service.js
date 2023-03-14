import HttpClient from '@/_helpers/http-client';

const tooljetAdapter = new HttpClient();

function findOne(organizationId, tableId, query = '') {
  return tooljetAdapter.get(`/tooljet_db/organizations/${organizationId}/proxy/${tableId}?${query}`);
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

function createRow(organizationId, tableId, data) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/proxy/${tableId}`, data);
}

function createColumn(organizationId, tableId, columnName, dataType, defaultValue) {
  return tooljetAdapter.post(`/tooljet_db/organizations/${organizationId}/table/${tableId}/column`, {
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

function updateRows(organizationId, tableId, data, query = '') {
  return tooljetAdapter.patch(`/tooljet_db/organizations/${organizationId}/proxy/${tableId}?${query}`, data);
}

function deleteRow(organizationId, tableId, query = '') {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/proxy/${tableId}?${query}`);
}

function deleteColumn(organizationId, tableId, columnName) {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/table/${tableId}/column/${columnName}`);
}

function deleteTable(organizationId, tableId) {
  return tooljetAdapter.delete(`/tooljet_db/organizations/${organizationId}/table/${tableId}`);
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
