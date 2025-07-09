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
  bulkUpdateQueryOptions,
};

function getAll(appVersionId, mode) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-queries/${appVersionId}?mode=${mode}`, requestOptions).then(handleResponse);
}

function create(app_id, app_version_id, name, kind, options, data_source_id, plugin_id) {
  const body = {
    app_id,
    app_version_id,
    name,
    kind,
    options,
    data_source_id,
    plugin_id,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(
    `${config.apiUrl}/data-queries/data-sources/${data_source_id}/versions/${app_version_id}`,
    requestOptions
  ).then(handleResponse);
}

function update(id, versionId, name, options, dataSourceId) {
  const body = {
    options,
    name,
    data_source_id: dataSourceId,
  };

  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data-queries/${id}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function bulkUpdateQueryOptions(queryOptions, appVersionId) {
  const body = {
    data_queries_options: queryOptions,
    app_version_id: appVersionId,
  };

  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };

  return fetch(`${config.apiUrl}/data-queries/`, requestOptions).then(handleResponse);
}

function updateStatus(id, status) {
  const body = {
    status,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data-queries/${id}/status`, requestOptions).then(handleResponse);
}

function del(id, versionId) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-queries/${id}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function run(queryId, resolvedOptions, options, versionId, environmentId, mode) {
  const body = {
    resolvedOptions: resolvedOptions,
    options: options,
  };

  let url = `${config.apiUrl}/data-queries/${queryId}/versions/${versionId}/run${
    environmentId && environmentId !== 'undefined' ? `/${environmentId}` : ''
  }?mode=${mode}`;

  //For public/released apps
  if (!environmentId || !versionId) {
    url = `${config.apiUrl}/data-queries/${queryId}/run`;
  }

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(url, requestOptions).then(handleResponse);
}

function preview(query, options, versionId, environmentId) {
  const body = {
    query,
    options: options,
    app_version_id: versionId,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(
    `${config.apiUrl}/data-queries/${query?.id}/versions/${versionId}/preview${
      environmentId && environmentId !== 'undefined' ? `/${environmentId}` : ''
    }`,
    requestOptions
  ).then(handleResponse);
}

function changeQueryDataSource(id, dataSourceId, versionId, type, kind) {
  const body = {
    data_source_id: dataSourceId,
    type,
    kind,
  };
  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-queries/${id}/versions/${versionId}/data-source`, requestOptions).then(
    handleResponse
  );
}
