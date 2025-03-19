import HttpClient from '@/_helpers/http-client';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import _ from 'lodash';

const tooljetAdapter = new HttpClient();

function findOne(headers, tableId, query = '') {
  return tooljetAdapter.get(`/tooljet-db/proxy/${tableId}?${query}`, headers);
}

function findAll(organizationId) {
  return tooljetAdapter.get(`/tooljet-db/organizations/${organizationId}/tables`);
}

async function getTablesLimit() {
  const res = await tooljetAdapter.get(`/tooljet-db/tables/limits`);
  return res;
}

function createTable(organizationId, tableName, columns, foreignKeyColumns, checkingValues = false) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table`, {
    table_name: tableName,
    columns,
    ...(checkingValues && { foreign_keys: foreignKeyColumns }),
  });
}

function viewTable(organizationId, tableName) {
  return tooljetAdapter.get(`/tooljet-db/organizations/${organizationId}/table/${tableName}`);
}

function bulkUpload(organizationId, tableName, file) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableName}/bulk-upload`, file);
}

function createRow(headers, tableId, data) {
  return tooljetAdapter.post(`/tooljet-db/proxy/${tableId}`, data, headers);
}

function createColumn(
  organizationId,
  tableId,
  columnName,
  dataType,
  defaultValue,
  isNotNull,
  isUniqueConstraint,
  isCheckSerialType = false,
  checkingValues = false,
  foreignKeyArray,
  configurations = {}
) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableId}/column`, {
    column: {
      column_name: columnName,
      data_type: dataType,
      ...(!isCheckSerialType && { column_default: defaultValue }),
      constraints_type: {
        is_not_null: isNotNull,
        is_unique: isUniqueConstraint,
      },
      configurations,
    },
    ...(checkingValues && { foreign_keys: foreignKeyArray }),
  });
}

function updateTable(organizationId, tableName, columns) {
  return tooljetAdapter.patch(`/tooljet-db/${organizationId}/perform`, {
    action: 'update_table',
    table_name: tableName,
    columns,
  });
}

function renameTable(organizationId, tableName, newTableName, data = []) {
  let bodyData = deepClone(data);
  bodyData.forEach((obj) => {
    ['new_column', 'old_column'].forEach(function (key) {
      if (obj[key]?.data_type === 'serial') delete obj[key]?.column_default;
      delete obj[key]?.dataTypeDetails;
    });
  });
  return tooljetAdapter.patch(`/tooljet-db/organizations/${organizationId}/table/${tableName}`, {
    table_name: tableName,
    ...(newTableName !== tableName && { new_table_name: newTableName }),
    columns: bodyData,
  });
}

function editForeignKey(organizationId, tableName, id, data = []) {
  return tooljetAdapter.put(`/tooljet-db/organizations/${organizationId}/table/${tableName}/foreignkey`, {
    foreign_key_id: id,
    foreign_keys: data,
  });
}

function createForeignKey(organizationId, tableName, data = []) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableName}/foreignkey`, {
    foreign_keys: data,
  });
}

function deleteForeignKey(organizationId, tableName, id) {
  return tooljetAdapter.delete(`/tooljet-db/organizations/${organizationId}/table/${tableName}/foreignkey/${id}`);
}

function updateRows(headers, tableId, data, query = '') {
  return tooljetAdapter.patch(`/tooljet-db/proxy/${tableId}?${query}`, data, headers);
}

function updateColumn(organizationId, tableName, columns) {
  return tooljetAdapter.patch(
    `/tooljet-db/organizations/${organizationId}/table/${tableName}/column`,
    columns,
    organizationId
  );
}

function deleteRows(headers, tableId, query = '') {
  return tooljetAdapter.delete(`/tooljet-db/proxy/${tableId}?${query}`, headers);
}

function deleteColumn(organizationId, tableName, columnName) {
  return tooljetAdapter.delete(`/tooljet-db/organizations/${organizationId}/table/${tableName}/column/${columnName}`);
}

function deleteTable(organizationId, tableName) {
  return tooljetAdapter.delete(`/tooljet-db/organizations/${organizationId}/table/${tableName}`);
}

function joinTables(headers, organizationId, data) {
  return tooljetAdapter.post(`tooljet-db/organizations/${organizationId}/join`, data, headers);
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
  getTablesLimit,
  bulkUpload,
  joinTables,
  updateColumn,
  editForeignKey,
  createForeignKey,
  deleteForeignKey,
};
