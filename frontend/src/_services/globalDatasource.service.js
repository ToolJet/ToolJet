import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const globalDatasourceService = {
  create,
  getAll,
  save,
  deleteDataSource,
  convertToGlobal,
  getDataSourceByEnvironmentId,
  getForApp,
};

function getForApp(organizationId, appVersionId, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(
    `${config.apiUrl}/data-sources/${organizationId}/environments/${environmentId}/versions/${appVersionId}`,
    requestOptions
  ).then(handleResponse);
}

function getAll(organizationId, appVersionId, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(`${config.apiUrl}/data-sources/${organizationId}`, requestOptions).then(handleResponse);
}

function create({ plugin_id, name, kind, options, scope, environment_id }) {
  const body = {
    plugin_id,
    name,
    kind,
    options,
    scope,
    environment_id,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources`, requestOptions).then(handleResponse);
}

function save({ id, name, options, environment_id }) {
  const body = {
    name,
    options,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/${id}?environment_id=${environment_id}`, requestOptions).then(
    handleResponse
  );
}

function deleteDataSource(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/${id}`, requestOptions).then(handleResponse);
}

function convertToGlobal(id) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/${id}/scope`, requestOptions).then(handleResponse);
}

function getDataSourceByEnvironmentId(dataSourceId, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/${dataSourceId}/environment/${environmentId}`, requestOptions).then(
    handleResponse
  );
}
