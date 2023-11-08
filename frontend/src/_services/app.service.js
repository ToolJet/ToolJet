import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appService = {
  getConfig,
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
  fetchApp,
  getAppBySlug,
  fetchAppBySlug,
  getAppByVersion,
  fetchAppByVersion,
  saveApp,
  getAppUsers,
  createAppUser,
  setPasswordFromToken,
  acceptInvite,
};

function getConfig() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/config`, requestOptions).then(handleResponse);
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

function getVersions(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/versions`, requestOptions).then(handleResponse);
}

function importApp(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/apps/import`, requestOptions).then(handleResponse);
}

function getTables(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}/tables`, requestOptions).then(handleResponse);
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

// v2 api for fetching app
function fetchApp(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/v2/apps/${id}`, requestOptions).then(handleResponse);
}

function deleteApp(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function getAppBySlug(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/slugs/${slug}`, requestOptions).then(handleResponse);
}

function fetchAppBySlug(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/v2/apps/slugs/${slug}`, requestOptions).then((resp) => handleResponse(resp, true));
}

function getAppByVersion(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}
function fetchAppByVersion(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/v2/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
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

function createAppUser(app_id, org_user_id, role) {
  const body = {
    app_id,
    org_user_id,
    role,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/app_users`, requestOptions).then(handleResponse);
}

function setPasswordFromToken({ token, password, organization, role, firstName, lastName, organizationToken }) {
  const body = {
    token,
    organizationToken,
    password,
    organization,
    role,
    first_name: firstName,
    last_name: lastName,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/set-password-from-token`, requestOptions).then(handleResponse);
}

function acceptInvite({ token, password }) {
  const body = {
    token,
    password,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/accept-invite`, requestOptions);
}
