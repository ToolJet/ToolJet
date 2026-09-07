import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { appendBranchParam } from '@/_helpers/active-branch';

export const appPermissionService = {
  getPagePermission,
  getUsers,
  createPagePermission,
  updatePagePermission,
  deletePagePermission,
  getQueryPermission,
  createQueryPermission,
  updateQueryPermission,
  deleteQueryPermission,
  getComponentPermission,
  createComponentPermission,
  updateComponentPermission,
  deleteComponentPermission,
};

function getPagePermission(appId, pageId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`), requestOptions).then(
    handleResponse
  );
}

function getUsers(appId, type) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/pages/${type}`), requestOptions).then(
    handleResponse
  );
}

function createPagePermission(appId, pageId, body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`), requestOptions).then(
    handleResponse
  );
}

function updatePagePermission(appId, pageId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`), requestOptions).then(
    handleResponse
  );
}

function deletePagePermission(appId, pageId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/pages/${pageId}`), requestOptions).then(
    handleResponse
  );
}

function getQueryPermission(appId, queryId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/queries/${queryId}`), requestOptions).then(
    handleResponse
  );
}

function createQueryPermission(appId, queryId, body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/queries/${queryId}`), requestOptions).then(
    handleResponse
  );
}

function updateQueryPermission(appId, queryId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/queries/${queryId}`), requestOptions).then(
    handleResponse
  );
}

function deleteQueryPermission(appId, queryId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/queries/${queryId}`), requestOptions).then(
    handleResponse
  );
}

function getComponentPermission(appId, componentId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(
    appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/components/${componentId}`),
    requestOptions
  ).then(handleResponse);
}

function createComponentPermission(appId, componentId, body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(
    appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/components/${componentId}`),
    requestOptions
  ).then(handleResponse);
}

function updateComponentPermission(appId, componentId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(
    appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/components/${componentId}`),
    requestOptions
  ).then(handleResponse);
}

function deleteComponentPermission(appId, componentId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(
    appendBranchParam(`${config.apiUrl}/app-permissions/${appId}/components/${componentId}`),
    requestOptions
  ).then(handleResponse);
}
