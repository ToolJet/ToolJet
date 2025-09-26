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
  fetchAddableDs,
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
  return fetch(`${config.apiUrl}/v2/group-permissions`, requestOptions).then(handleResponse);
}

function update(groupPermissionId, body) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function del(groupPermissionId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function getGroup(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/${groupPermissionId}`, requestOptions).then(handleResponse);
}

function fetchAddableApps() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/granular-permissions/addable-apps`, requestOptions).then(
    handleResponse
  );
}

function fetchAddableDs() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/granular-permissions/addable-data-sources`, requestOptions).then(
    handleResponse
  );
}

function getGroups() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group-permissions`, requestOptions).then(handleResponse);
}

function addUsersInGroups(groupId, body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/${groupId}/users`, requestOptions).then(handleResponse);
}

function deleteUserFromGroup(id) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/users/${id}`, requestOptions).then(handleResponse);
}

function createGranularPermission(id, body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  const type = body.type === 'app' ? 'app' : 'data-source';
  return fetch(`${config.apiUrl}/v2/group-permissions/${id}/granular-permissions/${type}`, requestOptions).then(
    handleResponse
  );
}

function updateGranularPermission(permission, body) {
  const id = permission.id;
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  const type = permission.type === 'app' ? 'app' : 'data-source';
  return fetch(`${config.apiUrl}/v2/group-permissions/granular-permissions/${type}/${id}`, requestOptions).then(
    handleResponse
  );
}

function deleteGranularPermission(permission) {
  const id = permission.id;
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  const type = permission.type === 'app' ? 'app' : 'data-source';
  return fetch(`${config.apiUrl}/v2/group-permissions/granular-permissions/${type}/${id}`, requestOptions).then(
    handleResponse
  );
}

function fetchGranularPermissions(groupPermissionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/group-permissions/${groupPermissionId}/granular-permissions`, requestOptions).then(
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
  return fetch(`${config.apiUrl}/v2/group-permissions/role/user`, requestOptions).then(handleResponse);
}

function getUsersInGroup(groupPermissionId, searchInput = '') {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(
    `${config.apiUrl}/v2/group-permissions/${groupPermissionId}/users?input=${searchInput && searchInput?.trim()}`,
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
    `${config.apiUrl}/v2/group-permissions/${groupPermissionId}/users/addable-users?input=${searchInput.trim()}`,
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
  return fetch(`${config.apiUrl}/v2/group-permissions/${groupPermissionId}/duplicate`, requestOptions).then(
    handleResponse
  );
}
