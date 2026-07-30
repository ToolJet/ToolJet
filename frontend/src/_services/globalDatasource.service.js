import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const globalDatasourceService = {
  create,
  getAll,
  getAiTaggableDataSources,
  save,
  deleteDataSource,
  convertToGlobal,
  getDataSourceByEnvironmentId,
  getForApp,
  getQueriesLinkedToDatasource,
  getQueriesLinkedToMarketplacePlugin,
};

// Datasources the current user may tag in the AI prompt — RBAC-filtered server-side to the AI
// use/configure gate (organization is derived from the session). Returns [{ id, name, kind }].
function getAiTaggableDataSources() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(`${config.apiUrl}/ai/taggable-datasources`, requestOptions).then(handleResponse);
}

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

function getQueriesLinkedToMarketplacePlugin(pluginId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/dependent-queries/marketplace-plugin/${pluginId}`, requestOptions).then(
    handleResponse
  );
}

function getQueriesLinkedToDatasource(dataSourceId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-sources/dependent-queries/${dataSourceId}`, requestOptions).then(handleResponse);
}
