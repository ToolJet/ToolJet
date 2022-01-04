import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const dataqueryService = {
  create,
  getAll,
  run,
  update,
  del,
  preview,
};

function getAll(appId, appVersionId) {
  const requestOptions = { method: 'GET', headers: authHeader() };

  let searchParams = new URLSearchParams(`app_id=${appId}`);
  appVersionId && searchParams.append('app_version_id', appVersionId);

  return fetch(`${config.apiUrl}/data_queries?` + searchParams, requestOptions).then(handleResponse);
}

function create(app_id, app_version_id, name, kind, options, data_source_id) {
  const body = {
    app_id,
    app_version_id,
    name,
    kind,
    options,
    data_source_id: kind === 'runjs' ? null : data_source_id,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries`, requestOptions).then(handleResponse);
}

function update(id, name, options) {
  const body = {
    options,
    name,
  };

  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries/${id}`, requestOptions).then(handleResponse);
}

function del(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader() };
  return fetch(`${config.apiUrl}/data_queries/${id}`, requestOptions).then(handleResponse);
}

function run(queryId, options) {
  const body = {
    options: options,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries/${queryId}/run`, requestOptions).then(handleResponse);
}

function preview(query, options) {
  const body = {
    query,
    options: options,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_queries/preview`, requestOptions).then(handleResponse);
}
