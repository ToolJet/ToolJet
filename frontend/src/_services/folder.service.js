import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const folderService = {
  create,
  deleteFolder,
  getAll,
  addToFolder,
  removeAppFromFolder,
  updateFolder,
};

function getAll(searchKey = '') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/folders?searchKey=${searchKey}`, requestOptions).then(handleResponse);
}

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
  return fetch(`${config.apiUrl}/folder_apps`, requestOptions).then(handleResponse);
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
  return fetch(`${config.apiUrl}/folder_apps/${folderId}`, requestOptions).then(handleResponse);
}
