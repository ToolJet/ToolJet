import HttpClient from '@/_helpers/http-client';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { authHeader } from '@/_helpers';
import _ from 'lodash';
import { currentEnvironmentId } from '@/TooljetDatabase/_stores/tjdbStore';

const tooljetAdapter = new HttpClient();

// The ONLY way to address /tooljet-db/proxy/*. environment_id is injected here, never passed in -
// the same ambient-scope treatment HttpClient.request already gives tj-workspace-id
// (frontend/src/_helpers/http-client.js: `options.headers['tj-workspace-id'] = session?...`).
// When nothing is selected the param is omitted rather than thrown on: the App Builder's TJDB
// query editor (SelectBox.jsx, ToolJetDbOperations.jsx) calls these functions with the TJDB store
// never mounted, and the backend already defaults a missing environment_id to development.
function proxyUrl(tableId, query = '') {
  const environmentId = currentEnvironmentId();
  const envQuery = environmentId ? `environment_id=${environmentId}` : '';
  return `/tooljet-db/proxy/${tableId}?${[query, envQuery].filter(Boolean).join('&')}`;
}

function findOne(tableId, query = '') {
  return tooljetAdapter.get(proxyUrl(tableId, query));
}

function findAll(organizationId) {
  return tooljetAdapter.get(`/tooljet-db/organizations/${organizationId}/tables`);
}

async function getTablesLimit() {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const res = await tooljetAdapter.get(`/tooljet-db/tables/limits/${organizationId}`);
  return res;
}

function createTable(
  organizationId,
  tableName,
  columns,
  foreignKeyColumns,
  checkingValues = false,
  migrationName = ''
) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table`, {
    table_name: tableName,
    columns,
    ...(checkingValues && { foreign_keys: foreignKeyColumns }),
    ...(migrationName && { migration_name: migrationName }),
  });
}

function viewTable(organizationId, tableName) {
  const environmentId = currentEnvironmentId();
  const query = environmentId ? `?environment_id=${environmentId}` : '';
  return tooljetAdapter.get(`/tooljet-db/organizations/${organizationId}/table/${tableName}${query}`);
}

function getTableMigrations(organizationId, tableId) {
  return tooljetAdapter.get(`/tooljet-db/organizations/${organizationId}/table/${tableId}/migrations`);
}

function previewPromoteTable(organizationId, tableId, environmentId) {
  return tooljetAdapter.get(
    `/tooljet-db/organizations/${organizationId}/table/${tableId}/promote/preview?environment_id=${environmentId}`
  );
}

function promoteTable(organizationId, tableId, environmentId) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableId}/promote`, {
    environment_id: environmentId,
  });
}

// Environment-blind on purpose, not by oversight: the route takes no environment parameter
// (server/src/modules/tooljet-db/controller.ts, `bulkUpload`), so a CSV uploaded while viewing
// staging still lands in development. Tracked as a backend ticket; do not add environment_id here
// until the controller accepts it - a param the server ignores is a fix that only looks like one.
function bulkUpload(organizationId, tableName, file) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableName}/bulk-upload`, file);
}

function sqlExecution(organizationId, tableId, body) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableId}/sql`, body);
}

// A tracked migration step, unlike sqlExecution above (a one-off DML action against whatever
// environment is currently open). Runs against the table's own development relation.
function recordRawSqlMigration(organizationId, tableId, sql, refs = {}) {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableId}/migrations/sql`, {
    sql,
    refs,
  });
}

function createRow(tableId, data) {
  return tooljetAdapter.post(proxyUrl(tableId), data);
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
  configurations = {},
  migrationName = ''
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
    ...(migrationName && { migration_name: migrationName }),
  });
}

function updateTable(organizationId, tableName, columns) {
  return tooljetAdapter.patch(`/tooljet-db/${organizationId}/perform`, {
    action: 'update_table',
    table_name: tableName,
    columns,
  });
}

function renameTable(organizationId, tableName, newTableName, data = [], migrationName = '') {
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
    ...(migrationName && { migration_name: migrationName }),
  });
}

function editForeignKey(organizationId, tableName, id, data = [], migrationName = '') {
  return tooljetAdapter.put(`/tooljet-db/organizations/${organizationId}/table/${tableName}/foreignkey`, {
    foreign_key_id: id,
    foreign_keys: data,
    ...(migrationName && { migration_name: migrationName }),
  });
}

function createForeignKey(organizationId, tableName, data = [], migrationName = '') {
  return tooljetAdapter.post(`/tooljet-db/organizations/${organizationId}/table/${tableName}/foreignkey`, {
    foreign_keys: data,
    ...(migrationName && { migration_name: migrationName }),
  });
}

function deleteForeignKey(organizationId, tableName, id, migrationName = '') {
  return tooljetAdapter.delete(
    `/tooljet-db/organizations/${organizationId}/table/${tableName}/foreignkey/${id}`,
    migrationName ? { migration_name: migrationName } : null
  );
}

function updateRows(tableId, data, query = '') {
  return tooljetAdapter.patch(proxyUrl(tableId, query), data);
}

function updateColumn(organizationId, tableName, columns) {
  return tooljetAdapter.patch(
    `/tooljet-db/organizations/${organizationId}/table/${tableName}/column`,
    columns,
    organizationId
  );
}

function deleteRows(tableId, query = '') {
  return tooljetAdapter.delete(proxyUrl(tableId, query));
}

function deleteColumn(organizationId, tableName, columnName, migrationName = '') {
  return tooljetAdapter.delete(
    `/tooljet-db/organizations/${organizationId}/table/${tableName}/column/${columnName}`,
    migrationName ? { migration_name: migrationName } : null
  );
}

function deleteTable(organizationId, tableName, migrationName = '') {
  return tooljetAdapter.delete(
    `/tooljet-db/organizations/${organizationId}/table/${tableName}`,
    migrationName ? { migration_name: migrationName } : null
  );
}

function getTableDependents(organizationId, tableId) {
  return tooljetAdapter.get(`/tooljet-db/organizations/${organizationId}/table/${tableId}/dependents`);
}

export const tooljetDatabaseService = {
  findOne,
  findAll,
  viewTable,
  getTableMigrations,
  getTableDependents,
  previewPromoteTable,
  promoteTable,
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
  sqlExecution,
  recordRawSqlMigration,
  updateColumn,
  editForeignKey,
  createForeignKey,
  deleteForeignKey,
};
