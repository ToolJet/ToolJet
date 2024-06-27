import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const groupPermissionV2Service = {
  create,
  update,
  del,
  getGroup,
  getGroups,
  fetchAddableApps,
  getUsersInGroup,
  getUsersNotInGroup,
  updateUserRole,
  addUsersInGroups,
  deleteUserFromGroup,
  createGranularPermission,
  fetchGranularPermissions,
  deleteGranularPermission,
  updateGranularPermission,
  duplicate,
};

function create(name) {
  const body = {
    name,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group_permissions`, requestOptions).then(handleResponse);
}

function update(groupPermissionId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function del(groupPermissionId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function getGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function fetchAddableApps() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/granular-permissions/addable-apps`, requestOptions).then(
    handleResponse
  );
}

function getGroups() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group_permissions`, requestOptions).then(handleResponse);
}

function addUsersInGroups(body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/group-user`, requestOptions).then(handleResponse);
}

function deleteUserFromGroup(id) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/group-user/${id}`, requestOptions).then(handleResponse);
}

function createGranularPermission(body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/granular-permissions`, requestOptions).then(handleResponse);
}

function updateGranularPermission(id, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/granular-permissions/update/${id}`, requestOptions).then(
    handleResponse
  );
}

function deleteGranularPermission(id) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/granular-permissions/${id}`, requestOptions).then(handleResponse);
}

function fetchGranularPermissions(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/${groupPermissionId}/granular-permissions`, requestOptions).then(
    handleResponse
  );
}

function updateUserRole(body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/user-role/edit`, requestOptions).then(handleResponse);
}

function getUsersInGroup(groupPermissionId, searchInput = '') {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(
    `${config.apiUrl}/v2/group_permissions/${groupPermissionId}/group-user?input=${searchInput && searchInput?.trim()}`,
    requestOptions
  ).then(handleResponse);
}

function getUsersNotInGroup(searchInput, groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(
    `${config.apiUrl}/v2/group_permissions/${groupPermissionId}/group-user/addable-users?input=${searchInput.trim()}`,
    requestOptions
  ).then(handleResponse);
}

function duplicate(groupPermissionId, body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group_permissions/${groupPermissionId}/duplicate`, requestOptions).then(
    handleResponse
  );
}
