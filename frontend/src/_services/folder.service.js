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
  const url = `${config.apiUrl}/folder-apps?searchKey=${searchKey}&type=${type}`;
  return fetch(appendBranchParam(url), requestOptions).then(handleResponse);
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

function bulkAddToFolder(appIds, folderId) {
  const body = { app_ids: appIds, folder_id: folderId };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  const url = `${config.apiUrl}/folder-apps`;
  return fetch(appendBranchParam(url), requestOptions).then(handleResponse);
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

function removeAppFromFolder(appId, folderId) {
  const body = { app_id: appId };
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  const url = `${config.apiUrl}/folder-apps/${folderId}`;
  return fetch(appendBranchParam(url), requestOptions).then(handleResponse);
}
