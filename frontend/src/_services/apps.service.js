import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import queryString from 'query-string';

export const appsService = {
  validatePrivateApp,
  validateReleasedApp,
  setVisibility,
  setMaintenance,
  setSlug,
  getAll,
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
  getAppBySlug,
  getAppByVersion,
  saveApp,
  getAppUsers,
  getVersions,
  getTables,
};

function validateReleasedApp(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/validate-released-app-access/${slug}`, requestOptions).then(handleResponse);
}

function validatePrivateApp(slug, queryParams) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = queryString.stringify(queryParams);

  return fetch(
    `${config.apiUrl}/apps/validate-private-app-access/${slug}${query ? `?${query}` : ''}`,
    requestOptions
  ).then(handleResponse);
}

function getAll(page, folder, searchKey) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  if (page === 0) return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
  else
    return fetch(
      `${config.apiUrl}/apps?page=${page}&folder=${folder || ''}&searchKey=${searchKey}`,
      requestOptions
    ).then(handleResponse);
}

function createApp(body = {}) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
}

function cloneApp(id) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/clone`, requestOptions).then(handleResponse);
}

function exportApp(id, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/export${versionId ? `?versionId=${versionId}` : ''}`, requestOptions).then(
    handleResponse
  );
}

function getVersions(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/versions`, requestOptions).then(handleResponse);
}

function importApp(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/apps/import`, requestOptions).then(handleResponse);
}

function changeIcon(icon, appId) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ icon }),
  };
  return fetch(`${config.apiUrl}/apps/${appId}/icons`, requestOptions).then(handleResponse);
}

function getApp(id, accessType) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}${accessType ? `?access_type=${accessType}` : ''}`, requestOptions).then(
    handleResponse
  );
}

function deleteApp(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function getAppBySlug(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/slugs/${slug}`, requestOptions).then((response) =>
    handleResponse(response, true)
  );
}

function getAppByVersion(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function saveApp(id, attributes) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ app: attributes }),
  };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function getAppUsers(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/users`, requestOptions).then(handleResponse);
}

function setVisibility(appId, visibility) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ app: { is_public: visibility } }),
  };
  return fetch(`${config.apiUrl}/apps/${appId}`, requestOptions).then(handleResponse);
}

function setMaintenance(appId, value) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ app: { is_maintenance_on: value } }),
  };
  return fetch(`${config.apiUrl}/apps/${appId}`, requestOptions).then(handleResponse);
}

function setSlug(appId, slug) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ app: { slug: slug } }),
  };
  return fetch(`${config.apiUrl}/apps/${appId}`, requestOptions).then(handleResponse);
}

function exportResource(body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/v2/resources/export`, requestOptions).then(handleResponse);
}

function importResource(body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/resources/import`, requestOptions).then(handleResponse);
}

function cloneResource(body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/v2/resources/clone`, requestOptions).then(handleResponse);
}

function getTables(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/tables`, requestOptions).then(handleResponse);
}
