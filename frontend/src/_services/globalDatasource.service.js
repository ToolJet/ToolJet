import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { getActiveBranchId } from '@/_helpers/active-branch';
import { buildSearchParams } from '@/_helpers/searchParams';
import { getAuthRequestOptions } from '@/_helpers/authRequestOptions';

export const globalDatasourceService = {
  create,
  getAll,
  getAllV2,
  pinResources,
  unpinResource,
  reorderPins,
  bulkDeleteDataSources,
  bulkMoveDataSources,
  bulkRemoveDataSources,
  bulkDeleteDataSourceFolders,
  getAiTaggableDataSources,
  save,
  deleteDataSource,
  convertToGlobal,
  getDataSourceByEnvironmentId,
  getForApp,
  getQueriesLinkedToDatasource,
  getQueriesLinkedToMarketplacePlugin,
};

function appendBranchId(url) {
  const branchId = getActiveBranchId();
  if (!branchId) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}branch_id=${branchId}`;
}

// Datasources the current user may tag in the AI prompt — RBAC-filtered server-side to the AI
// use/configure gate (organization is derived from the session). Returns [{ id, name, kind }].
function getAiTaggableDataSources() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(`${config.apiUrl}/ai/taggable-datasources`, requestOptions).then(handleResponse);
}

function getForApp(organizationId, appVersionId, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(
    appendBranchId(
      `${config.apiUrl}/data-sources/${organizationId}/environments/${environmentId}/versions/${appVersionId}`
    ),
    requestOptions
  ).then(handleResponse);
}

function getAll(organizationId, _appVersionId, _environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(appendBranchId(`${config.apiUrl}/data-sources/${organizationId}`), requestOptions).then(handleResponse);
}

// v2 dashboard list: one page of rows. `folderId` lists that folder's data sources, `search` returns a flat list.
/**
 * @param {import('./types/globalDatasource.types').DataSourcesQueryParams} params
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('./types/globalDatasource.types').DataSourceListResponse>}
 */
function getAllV2({ folderId, search, branchId, pageNo, pageSize }, { signal } = {}) {
  return fetch(
    `${config.apiUrl}/v2/data-sources?${buildSearchParams({
      page: pageNo,
      page_size: pageSize,
      folder_id: folderId,
      search,
      branch_id: branchId,
    })}`,
    { ...getAuthRequestOptions(), signal }
  ).then(handleResponse);
}

// Dashboard pins are per branch. Like `getAllV2`, the branch comes from the caller, not the store.
/** @param {{ resourceType: import('./types/globalDatasource.types').DataSourcePinKind, resourceIds: string[], branchId: string | null }} params */
function pinResources({ resourceType, resourceIds, branchId }) {
  const body = { resource_type: resourceType, resource_ids: resourceIds, ...(branchId && { branch_id: branchId }) };
  return fetch(`${config.apiUrl}/v2/data-sources/pins`, getAuthRequestOptions('POST', body)).then(handleResponse);
}

// Unpins one item, and also succeeds (204) when it wasn't pinned.
/** @param {{ resourceType: import('./types/globalDatasource.types').DataSourcePinKind, resourceId: string, branchId: string | null }} params */
function unpinResource({ resourceType, resourceId, branchId }) {
  const query = buildSearchParams({ branch_id: branchId });
  return fetch(
    `${config.apiUrl}/v2/data-sources/pins/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}${
      query ? `?${query}` : ''
    }`,
    getAuthRequestOptions('DELETE')
  ).then(handleResponse);
}

// `pins` must be every pin on the branch, in the new order; any other set is a 400. Responds 204 with no body.
/** @param {{ pins: { resource_type: import('./types/globalDatasource.types').DataSourcePinKind, resource_id: string }[], branchId: string | null }} params */
function reorderPins({ pins, branchId }) {
  const body = { items: pins, ...(branchId && { branch_id: branchId }) };
  return fetch(`${config.apiUrl}/v2/data-sources/pins/order`, getAuthRequestOptions('PUT', body)).then(handleResponse);
}

// Bulk calls are all or nothing: they resolve with `{ blocked_ids }`, and a non-empty list means nothing was written.
/** @returns {Promise<import('./types/globalDatasource.types').DataSourceBulkResponse>} */
function postBulk(path, body, branchId) {
  return fetch(
    `${config.apiUrl}/v2/data-sources/${path}`,
    getAuthRequestOptions('POST', { ...body, ...(branchId && { branch_id: branchId }) })
  ).then(handleResponse);
}

/** @param {{ dataSourceIds: string[], branchId: string | null }} params */
function bulkDeleteDataSources({ dataSourceIds, branchId }) {
  return postBulk('bulk-delete', { data_source_ids: dataSourceIds }, branchId);
}

/** @param {{ dataSourceIds: string[], folderId: string, branchId: string | null }} params */
function bulkMoveDataSources({ dataSourceIds, folderId, branchId }) {
  return postBulk('bulk-move', { data_source_ids: dataSourceIds, folder_id: folderId }, branchId);
}

// Data sources already at root are skipped, not blocked.
/** @param {{ dataSourceIds: string[], branchId: string | null }} params */
function bulkRemoveDataSources({ dataSourceIds, branchId }) {
  return postBulk('bulk-remove', { data_source_ids: dataSourceIds }, branchId);
}

/** @param {{ folderIds: string[], mode: import('./types/globalDatasource.types').DataSourceFolderDeleteMode, branchId: string | null }} params */
function bulkDeleteDataSourceFolders({ folderIds, mode, branchId }) {
  return postBulk('folders/bulk-delete', { folder_ids: folderIds, mode }, branchId);
}

function create({ plugin_id, name, kind, options, scope, environment_id }) {
  const body = {
    plugin_id,
    name,
    kind,
    options,
    scope,
    environment_id,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(appendBranchId(`${config.apiUrl}/data-sources`), requestOptions).then(handleResponse);
}

function save({ id, name, options, environment_id }) {
  const body = {
    name,
    options,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(
    appendBranchId(`${config.apiUrl}/data-sources/${id}?environment_id=${environment_id}`),
    requestOptions
  ).then(handleResponse);
}

function deleteDataSource(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(appendBranchId(`${config.apiUrl}/data-sources/${id}`), requestOptions).then(handleResponse);
}

function convertToGlobal(id) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/${id}/scope`, requestOptions).then(handleResponse);
}

function getDataSourceByEnvironmentId(dataSourceId, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    appendBranchId(`${config.apiUrl}/data-sources/${dataSourceId}/environment/${environmentId}`),
    requestOptions
  ).then(handleResponse);
}

function getQueriesLinkedToMarketplacePlugin(pluginId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/dependent-queries/marketplace-plugin/${pluginId}`, requestOptions).then(
    handleResponse
  );
}

function getQueriesLinkedToDatasource(dataSourceId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(appendBranchId(`${config.apiUrl}/data-sources/dependent-queries/${dataSourceId}`), requestOptions).then(
    handleResponse
  );
}
