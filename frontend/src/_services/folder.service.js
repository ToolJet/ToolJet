import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const folderService = {
  create,
  getAll,
  addToFolder
};

function getAll() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/folders/`, requestOptions).then(handleResponse);
}

function create(name) {
  const body = {
    name
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/folders`, requestOptions).then(handleResponse);
}

function addToFolder(appId, folderId) {
  const body = {
    app_id: appId,
    folder_id: folderId
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/folder_apps`, requestOptions).then(handleResponse);
}
