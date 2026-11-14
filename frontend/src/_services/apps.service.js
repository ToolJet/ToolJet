import config from 'config';
import { buildSearchParams } from '@/_helpers/searchParams';
import { authHeader, handleResponse, handleResponseWithoutValidation } from '@/_helpers';
import { getAuthRequestOptions } from '@/_helpers/authRequestOptions';
import { getActiveBranchId, appendBranchParam } from '@/_helpers/active-branch';
import queryString from 'query-string';

export const appsService = {
  getAppAuthenticationConfig,
  validatePrivateApp,
  validateReleasedApp,
  setVisibility,
  setMaintenance,
  setSlug,
  getAll,
  getAllAddableApps,
  createApp,
  cloneApp,
  exportApp,
  importApp,
  exportResource,
  importResource,
  cloneResource,
  changeIcon,
  deleteApp,
  getApp,
  getAppByVersion,
  saveApp,
  fetchAppsV2,
  renameApp,
  getAppUsers,
  getVersions,
  getTables,
  getWorkflows,
  getAppsLimit,
  getWorkflowLimit,
  releaseVersion,
  pinResources,
  unpinResource,
  reorderPins,
  bulkDeleteApps,
};

function getAppAuthenticationConfig(slug) {
  const requestOptions = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
  return fetch(`${config.apiUrl}/apps/app-authentication-config/${slug}`, requestOptions).then(
    handleResponseWithoutValidation
  );
}

function getWorkflows(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  // Needs the branch param — without it the backend resolves the org default branch and a
  // workflow that exists only on a feature branch comes back with a null name.
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${id}/workflows`), requestOptions).then(handleResponse);
}

function getAppsLimit() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/apps/limits`, requestOptions).then(handleResponse);
}

function validateReleasedApp(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/validate-released-app-access/${slug}`, requestOptions).then(handleResponse);
}

function validatePrivateApp(slug, queryParams) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = queryString.stringify(queryParams);

  return fetch(
    appendBranchParam(`${config.apiUrl}/apps/validate-private-app-access/${slug}${query ? `?${query}` : ''}`),
    requestOptions
  ).then((response) => handleResponse(response, false, { param: 'version', value: 'versionName' }));
}

//use default value for type of apps i.e.'front-end'
function getAll(page, folder, searchKey, type = 'front-end', context = undefined) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const branchId = getActiveBranchId();
  const branchParam = branchId ? `&branch_id=${branchId}` : '';
  const contextParam = context ? `&context=${context}` : '';
  if (page === 0)
    return fetch(
      `${config.apiUrl}/apps?all=true&folder=${folder || ''}&type=${type}${
        searchKey ? `&searchKey=${searchKey}` : ''
      }${branchParam}${contextParam}`,
      requestOptions
    ).then(handleResponse);
  else
    return fetch(
      `${config.apiUrl}/apps?page=${page}&folder=${
        folder || ''
      }&searchKey=${searchKey}&type=${type}${branchParam}${contextParam}`,
      requestOptions
    ).then(handleResponse);
}

function fetchAppsV2({ appType, folderId, searchQuery, branchId, pageNo, pageSize }, { signal } = {}) {
  return fetch(
    `${config.apiUrl}/v2/apps?${buildSearchParams({
      page: pageNo,
      type: appType,
      branch_id: branchId,
      search: searchQuery,
      folder_id: folderId,
      page_size: pageSize,
    })}`,
    { ...getAuthRequestOptions(), signal }
  ).then(handleResponse);
}

// Pins folders or apps for this user on the active branch; one kind per call. Responds 204 with no body.
function pinResources({ resourceType, resourceIds }) {
  const body = { resource_type: resourceType, resource_ids: resourceIds, branch_id: getActiveBranchId() };
  return fetch(`${config.apiUrl}/v2/pins`, getAuthRequestOptions('POST', body)).then(handleResponse);
}

// Unpins one item, and also succeeds (204) when it wasn't pinned.
function unpinResource({ resourceType, resourceId }) {
  const query = buildSearchParams({ branch_id: getActiveBranchId() });
  return fetch(
    `${config.apiUrl}/v2/pins/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}${query ? `?${query}` : ''}`,
    getAuthRequestOptions('DELETE')
  ).then(handleResponse);
}

// `pins` must be every pin of `appType`, in the new order; any other set is a 400. Responds 204 with no body.
function reorderPins({ appType, pins }) {
  const body = { type: appType, items: pins, branch_id: getActiveBranchId() };
  return fetch(`${config.apiUrl}/v2/pins/order`, getAuthRequestOptions('PUT', body)).then(handleResponse);
}

// All or nothing: responds 200 `{ blocked_ids }`; a non-empty list means nothing was deleted.
function bulkDeleteApps({ appIds, appType }) {
  const body = { app_ids: appIds, type: appType, branch_id: getActiveBranchId() };
  return fetch(`${config.apiUrl}/v2/apps/bulk-delete`, getAuthRequestOptions('POST', body)).then(handleResponse);
}

// TODO: the backend should resolve the editing version itself so the client needn't look it up before saving.
async function renameApp(id, name, appType) {
  const { versions } = await getVersions(id);
  const editingVersionId = versions?.find((version) => version?.isCurrentEditingVersion)?.id;
  return saveApp(id, { name, ...(editingVersionId && { editingVersionId }) }, appType);
}

// get all addable apps
function getAllAddableApps() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const branchId = getActiveBranchId();
  const branchParam = branchId ? `?branch_id=${branchId}` : '';
  return fetch(`${config.apiUrl}/apps/addable${branchParam}`, requestOptions).then(handleResponse);
}

function createApp(body = {}) {
  const branchId = getActiveBranchId();
  if (branchId) body.branchId = branchId;
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  switch (body.type) {
    case 'workflow':
      return createWorkflow(requestOptions);
    case 'module':
      return createModule(requestOptions);
    default:
      return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
  }
}

function createWorkflow(requestOptions) {
  return fetch(`${config.apiUrl}/workflows`, requestOptions).then(handleResponse);
}

function createModule(requestOptions) {
  return fetch(`${config.apiUrl}/modules`, requestOptions).then(handleResponse);
}

function cloneApp(id, name) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ name }),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${id}/clone`), requestOptions).then(handleResponse);
}

function exportApp(id, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    appendBranchParam(`${config.apiUrl}/apps/${id}/export${versionId ? `?versionId=${versionId}` : ''}`),
    requestOptions
  ).then(handleResponse);
}

function getVersions(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${id}/versions`), requestOptions).then(handleResponse);
}

function importApp(app, name) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ app, name }),
  };
  return fetch(`${config.apiUrl}/apps/import`, requestOptions).then(handleResponse);
}

function changeIcon(icon, appId) {
  const body = { icon };
  const branchId = getActiveBranchId();
  if (branchId) body.branch_id = branchId;
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${appId}/icons`), requestOptions).then(handleResponse);
}

function getApp(id, accessType) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    appendBranchParam(`${config.apiUrl}/apps/${id}${accessType ? `?access_type=${accessType}` : ''}`),
    requestOptions
  ).then(handleResponse);
}

function deleteApp(id, appType) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(
    appendBranchParam(`${config.apiUrl}/${appType === 'module' ? 'modules' : 'apps'}/${id}`),
    requestOptions
  ).then(handleResponse);
}

function getAppByVersion(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(appendBranchParam(`${config.apiUrl}/v2/apps/${appId}/versions/${versionId}`), requestOptions).then(
    handleResponse
  );
}

function saveApp(id, attributes, appType) {
  const branchId = getActiveBranchId();
  if (branchId) attributes.branch_id = branchId;
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ app: attributes }),
  };
  return fetch(
    appendBranchParam(`${config.apiUrl}/${appType === 'module' ? 'modules' : 'apps'}/${id}`),
    requestOptions
  ).then(handleResponse);
}

function getAppUsers(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/users`, requestOptions).then(handleResponse);
}

function setVisibility(appId, visibility) {
  const body = { app: { is_public: visibility } };
  const branchId = getActiveBranchId();
  if (branchId) body.app.branch_id = branchId;
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${appId}/public`), requestOptions).then(handleResponse);
}

function setMaintenance(appId, value) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ app: { is_maintenance_on: value } }),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${appId}`), requestOptions).then(handleResponse);
}

function setSlug(appId, slug) {
  const body = { app: { slug: slug } };
  const branchId = getActiveBranchId();
  if (branchId) body.app.branch_id = branchId;
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${appId}`), requestOptions).then(handleResponse);
}

function exportResource(body, appType) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
    credentials: 'include',
  };
  if (appType === 'module') {
    return fetch(appendBranchParam(`${config.apiUrl}/modules/export`), requestOptions).then(handleResponse);
  } else {
    return fetch(appendBranchParam(`${config.apiUrl}/v2/resources/export`), requestOptions).then(handleResponse);
  }
}

function importResource(body, appType) {
  const branchId = getActiveBranchId();
  if (branchId) body.branchId = branchId;
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  if (appType === 'module') {
    return fetch(appendBranchParam(`${config.apiUrl}/modules/import`), requestOptions).then(handleResponse);
  } else {
    return fetch(appendBranchParam(`${config.apiUrl}/v2/resources/import`), requestOptions).then(handleResponse);
  }
}

function cloneResource(body, appType) {
  const branchId = getActiveBranchId();
  if (branchId) body.branchId = branchId;
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
    credentials: 'include',
  };
  if (appType === 'module') {
    return fetch(appendBranchParam(`${config.apiUrl}/modules/clone`), requestOptions).then(handleResponse);
  } else {
    return fetch(appendBranchParam(`${config.apiUrl}/v2/resources/clone`), requestOptions).then(handleResponse);
  }
}

function getTables(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(appendBranchParam(`${config.apiUrl}/apps/${id}/tables`), requestOptions).then(handleResponse);
}

function getWorkflowLimit(type) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/workflows/limits/${type}`, requestOptions).then(handleResponse);
}

function releaseVersion(appId, versionToBeReleased) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ versionToBeReleased }),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/apps/${appId}/release`, requestOptions).then(handleResponse);
}
