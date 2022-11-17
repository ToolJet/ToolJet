import HttpClient from '@/_helpers/http-client';

const tooljetAdapter = new HttpClient();

function findOne(organizationId, tableName, query = '') {
  return tooljetAdapter.get(`/tooljet_db/${organizationId}/proxy/\${${tableName}}?${query}`);
}

function findAll(organizationId) {
  return tooljetAdapter.post(`/tooljet_db/${organizationId}/perform`, { action: 'view_tables' });
}

function createTable(organizationId, tableName, columns) {
  return tooljetAdapter.post(`/tooljet_db/${organizationId}/perform`, {
    action: 'create_table',
    table_name: tableName,
    columns,
  });
}

function createRow(organizationId, tableName, data) {
  return tooljetAdapter.post(`/tooljet_db/${organizationId}/proxy/\${${tableName}}`, data);
}

function createColumn(organizationId, tableName, columnName, dataType) {
  return tooljetAdapter.post(`/tooljet_db/${organizationId}/perform`, {
    action: 'add_column',
    table_name: tableName,
    column: {
      column_name: columnName,
      data_type: dataType,
    },
  });
}

function deleteTable(organizationId, tableName) {
  return tooljetAdapter.delete(`/tooljet_db/${organizationId}/proxy/\${${tableName}}`);
}

function deleteRow(organizationId, tableName, query = '') {
  return tooljetAdapter.delete(`/tooljet_db/${organizationId}/proxy/\${${tableName}}?${query}`);
}

export const tooljetDatabaseService = {
  findOne,
  findAll,
  createRow,
  createTable,
  createColumn,
  deleteRow,
  deleteTable,
};
