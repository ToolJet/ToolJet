import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { getActiveBranchId } from '@/_helpers/active-branch';

export const folderService = {
  create,
  deleteFolder,
  getAll,
  addToFolder,
  bulkAddToFolder,
  removeAppFromFolder,
  updateFolder,
};

function getAll(searchKey = '', type = 'front-end') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/folder-apps?searchKey=${searchKey}&type=${type}`, requestOptions).then(handleResponse);
}

function create(name, type) {
  const body = {
    name,
    type,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folders`, requestOptions).then(handleResponse);
}

function updateFolder(name, id) {
  const body = {
    name,
  };

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folders/${id}`, requestOptions).then(handleResponse);
}

function deleteFolder(id) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/folders/${id}`, requestOptions).then(handleResponse);
}

function bulkAddToFolder(appIds, folderId, type = 'front-end') {
  // workflows are not git-synced; skip x-branch-id so their folder_apps (branch_id = NULL) are matched
  const branchId = type !== 'workflow' ? getActiveBranchId() : null;
  const body = { app_ids: appIds, folder_id: folderId };
  const requestOptions = {
    method: 'POST',
    headers: {
      ...authHeader(),
      ...(branchId ? { 'x-branch-id': branchId } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folder-apps`, requestOptions).then(handleResponse);
}

function addToFolder(appId, folderId) {
  const body = {
    app_id: appId,
    folder_id: folderId,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folder-apps`, requestOptions).then(handleResponse);
}

function removeAppFromFolder(appId, folderId) {
  const body = {
    app_id: appId,
  };

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folder-apps/${folderId}`, requestOptions).then(handleResponse);
}
