import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const dataqueryService = {
  create,
  getAll,
  run,
  update,
  del,
  preview,
  changeQueryDataSource,
  updateStatus,
};

function getAll(appVersionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  let searchParams = new URLSearchParams(`app_version_id=${appVersionId}`);
  return fetch(`${config.apiUrl}/data_queries?` + searchParams, requestOptions).then(handleResponse);
}

function create(app_id, app_version_id, name, kind, options, data_source_id, plugin_id) {
  const body = {
    app_id,
    app_version_id,
    name,
    kind,
    options,
    data_source_id: kind === 'runjs' || kind === 'runpy' ? null : data_source_id,
    plugin_id,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries`, requestOptions).then(handleResponse);
}

function update(id, name, options) {
  const body = {
    options,
    name,
  };

  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries/${id}`, requestOptions).then(handleResponse);
}

function updateStatus(id, status) {
  const body = {
    status,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries/${id}/status`, requestOptions).then(handleResponse);
}

function del(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data_queries/${id}`, requestOptions).then(handleResponse);
}

function run(queryId, variables, options) {
  const body = {
    variables: variables,
    options: options,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries/${queryId}/run`, requestOptions).then(handleResponse);
}

function preview(query, options, versionId) {
  const body = {
    query,
    options: options,
    app_version_id: versionId,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries/preview`, requestOptions).then(handleResponse);
}

function changeQueryDataSource(id, dataSourceId) {
  const body = {
    data_source_id: dataSourceId,
  };
  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/data_queries/${id}/data_source`, requestOptions).then(handleResponse);
}
