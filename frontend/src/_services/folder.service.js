import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const folderService = {
  create,
  getAll,
  addToFolder,
  removeAppFromFolder,
};

function getAll(searchKey = '') {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/folders?searchKey=${searchKey}`, requestOptions).then(handleResponse);
}

function create(name) {
  const body = {
    name,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folders`, requestOptions).then(handleResponse);
}

function addToFolder(appId, folderId) {
  const body = {
    app_id: appId,
    folder_id: folderId,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
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
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folder_apps/${folderId}`, requestOptions).then(handleResponse);
}
