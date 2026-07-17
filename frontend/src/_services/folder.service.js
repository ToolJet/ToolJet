import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { appendBranchParam } from '@/_helpers/active-branch';

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
  // Workflows/non-git store folder_apps with branch_id = NULL — omit branch_id so the backend
  // matches the IS NULL rows. Front-end apps carry the active branch.
  const url = `${config.apiUrl}/folder-apps?searchKey=${searchKey}&type=${type}`;
  return fetch(type === 'workflow' ? url : appendBranchParam(url), requestOptions).then(handleResponse);
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
  const body = { app_ids: appIds, folder_id: folderId };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  // workflows are not git-synced — omit branch_id so the folder_app row is stored/matched with
  // branch_id = NULL. Front-end apps carry the active branch as a query param.
  const url = `${config.apiUrl}/folder-apps`;
  return fetch(type === 'workflow' ? url : appendBranchParam(url), requestOptions).then(handleResponse);
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
  // Single-add is used for front-end apps; carry the active branch.
  return fetch(appendBranchParam(`${config.apiUrl}/folder-apps`), requestOptions).then(handleResponse);
}

function removeAppFromFolder(appId, folderId, type = 'front-end') {
  const body = { app_id: appId };
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  // workflows are not git-synced — omit branch_id so the NULL-branch folder_app row is matched.
  const url = `${config.apiUrl}/folder-apps/${folderId}`;
  return fetch(type === 'workflow' ? url : appendBranchParam(url), requestOptions).then(handleResponse);
}
