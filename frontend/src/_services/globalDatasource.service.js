import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const globalDatasourceService = {
  create,
  getAll,
  save,
  deleteDataSource,
  convertToGlobal,
};

function getAll(organizationId) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  let searchParams = new URLSearchParams(`organization_id=${organizationId}`);
  return fetch(`${config.apiUrl}/v2/data_sources?` + searchParams, requestOptions).then(handleResponse);
}

function create(plugin_id, name, kind, options, app_id, app_version_id, scope) {
  const body = {
    plugin_id,
    name,
    kind,
    options,
    scope,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/v2/data_sources`, requestOptions).then(handleResponse);
}

function save(id, name, options) {
  const body = {
    name,
    options,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/v2/data_sources/${id}`, requestOptions).then(handleResponse);
}

function deleteDataSource(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader() };
  return fetch(`${config.apiUrl}/v2/data_sources/${id}`, requestOptions).then(handleResponse);
}

function convertToGlobal(id) {
  const requestOptions = { method: 'POST', headers: authHeader() };
  return fetch(`${config.apiUrl}/v2/data_sources/${id}/scope`, requestOptions).then(handleResponse);
}
