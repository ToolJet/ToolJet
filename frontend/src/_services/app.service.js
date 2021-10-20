import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appService = {
  getConfig,
  getAll,
  createApp,
  cloneApp,
  exportApp,
  importApp,
  deleteApp,
  getApp,
  getAppBySlug,
  getAppByVersion,
  saveApp,
  getAppUsers,
  createAppUser,
  setVisibility,
  setSlug,
};

function getConfig() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/config`, requestOptions).then(handleResponse);
}

function getAll(page, folder) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  if (page === 0) return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
  else return fetch(`${config.apiUrl}/apps?page=${page}&folder=${folder || ''}`, requestOptions).then(handleResponse);
}

function createApp() {
  const body = {};

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
}

function cloneApp(id) {
  const requestOptions = { method: 'POST', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${id}/clone`, requestOptions).then(handleResponse);
}

function exportApp(id) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${id}/export`, requestOptions).then(handleResponse);
}

function importApp(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/apps/import`, requestOptions).then(handleResponse);
}

function getApp(id) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function deleteApp(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function getAppBySlug(slug) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/slugs/${slug}`, requestOptions).then(handleResponse);
}

function getAppByVersion(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function saveApp(id, attributes) {
  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify({ app: attributes }) };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function getAppUsers(id) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${id}/users`, requestOptions).then(handleResponse);
}

function createAppUser(app_id, org_user_id, role) {
  const body = {
    app_id,
    org_user_id,
    role,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/app_users`, requestOptions).then(handleResponse);
}

function setVisibility(appId, visibility) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ app: { is_public: visibility } }),
  };
  return fetch(`${config.apiUrl}/apps/${appId}`, requestOptions).then(handleResponse);
}

function setSlug(appId, slug) {
  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify({ app: { slug: slug } }) };
  return fetch(`${config.apiUrl}/apps/${appId}`, requestOptions).then(handleResponse);
}
