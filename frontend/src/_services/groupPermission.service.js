import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const groupPermissionService = {
  create,
  update,
  del,
  getGroup,
  getGroups,
  getAppsInGroup,
  getAppsNotInGroup,
  getUsersInGroup,
  getUsersNotInGroup,
  getDataSourcesInGroup,
  getDataSourcesNotInGroup,
  updateAppGroupPermission,
  updateDataSourceGroupPermission,
  updateUserPermission,
  updateAppPermission,
  updateDataSourcePermission,
};

function create(group) {
  const body = {
    group,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/group_permissions`, requestOptions).then(handleResponse);
}

function update(groupPermissionId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function updateUserPermission(groupPermissionId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/user`, requestOptions).then(handleResponse);
}

function updateAppPermission(groupPermissionId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/app`, requestOptions).then(handleResponse);
}

function updateDataSourcePermission(groupPermissionId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/data-source`, requestOptions).then(
    handleResponse
  );
}

function del(groupPermissionId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function getGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function getGroups() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions`, requestOptions).then(handleResponse);
}

function getAppsInGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/apps`, requestOptions).then(handleResponse);
}

function getAppsNotInGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/addable_apps`, requestOptions).then(
    handleResponse
  );
}

function getDataSourcesInGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/data_sources`, requestOptions).then(
    handleResponse
  );
}

function getDataSourcesNotInGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/addable_data_sources`, requestOptions).then(
    handleResponse
  );
}

function getUsersInGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/group_permissions/${groupPermissionId}/users`, requestOptions).then(handleResponse);
}

function getUsersNotInGroup(searchInput, groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(
    `${config.apiUrl}/group_permissions/${groupPermissionId}/addable_users?input=${searchInput}`,
    requestOptions
  ).then(handleResponse);
}

function updateAppGroupPermission(groupPermissionId, appGroupPermissionId, actions) {
  const body = {
    actions,
  };

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(
    `${config.apiUrl}/group_permissions/${groupPermissionId}/app_group_permissions/${appGroupPermissionId}`,
    requestOptions
  ).then(handleResponse);
}

function updateDataSourceGroupPermission(groupPermissionId, dataSourceGroupPermissionId, actions) {
  const body = {
    actions,
  };

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(body),
    credentials: 'include',
  };
  return fetch(
    `${config.apiUrl}/group_permissions/${groupPermissionId}/data_source_group_permissions/${dataSourceGroupPermissionId}`,
    requestOptions
  ).then(handleResponse);
}
