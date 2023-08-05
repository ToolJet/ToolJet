import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appVersionService = {
  getAll,
  getOne,
  create,
  del,
  save,
};

function getAll(appId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${appId}/versions`, requestOptions).then(handleResponse);
}

function getOne(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function create(appId, versionName, versionFromId) {
  const body = {
    versionName,
    versionFromId,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions`, requestOptions).then(handleResponse);
}

function del(appId, versionId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function save(appId, versionId, values, isUserSwitchedVersion = false) {
  const body = { is_user_switched_version: isUserSwitchedVersion };
  if (values.definition) body['definition'] = values.definition;
  if (values.name) body['name'] = values.name;

  console.log('---arpit [app version service]', { values });
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}
