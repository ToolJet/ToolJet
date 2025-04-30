import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appPermissionService = {
  getPagePermission,
  getUsers,
  createPagePermission,
  updatePagePermission,
  deletePagePermission,
};

function getPagePermission(appId, pageId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`, requestOptions).then(handleResponse);
}

function getUsers(appId, type) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/app-permissions/${appId}/pages/${type}`, requestOptions).then(handleResponse);
}

function createPagePermission(appId, pageId, body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`, requestOptions).then(handleResponse);
}

function updatePagePermission(appId, pageId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`, requestOptions).then(handleResponse);
}

function deletePagePermission(appId, pageId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`, requestOptions).then(handleResponse);
}
