import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appVersionService = {
  getAll,
  create,
  save,
};

function getAll(appId) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${appId}/versions`, requestOptions).then(handleResponse);
}

function create(appId, versionName) {
  const body = {
    versionName,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions`, requestOptions).then(handleResponse);
}

function save(appId, versionId, definition) {
  const body = {
    definition,
  };

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}
