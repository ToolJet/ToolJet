import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { constructSearchParams } from '../_helpers/utils';

export const datasourceService = {
  create,
  getAll,
  deleteDataSource,
  test,
  setOauth2Token,
  save,
  fetchOauth2BaseUrl,
};

function getAll(appVersionId, environment_id) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(
    `${config.apiUrl}/data_sources?` + constructSearchParams({ app_version_id: appVersionId, environment_id }),
    requestOptions
  ).then(handleResponse);
}

function create(app_id, app_version_id, plugin_id, name, kind, options, environment_id) {
  const body = {
    app_id,
    app_version_id,
    plugin_id,
    name,
    kind,
    options,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_sources?` + constructSearchParams({ environment_id }), requestOptions).then(
    handleResponse
  );
}

function save(id, app_id, name, options, environment_id) {
  const body = {
    app_id,
    name,
    options,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_sources/${id}?` + constructSearchParams({ environment_id }), requestOptions).then(
    handleResponse
  );
}

function deleteDataSource(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader() };
  return fetch(`${config.apiUrl}/data_sources/${id}`, requestOptions).then(handleResponse);
}

function test(kind, options, plugin_id) {
  const body = {
    kind,
    options,
    plugin_id,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_sources/test_connection`, requestOptions).then(handleResponse);
}

function setOauth2Token(dataSourceId, body) {
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(
    `${config.apiUrl}/data_sources/${dataSourceId}/authorize_oauth2?` +
      constructSearchParams({
        ...(localStorage.getItem('currentAppEnvironmentIdForOauth') !== 'undefined' && {
          environment_id: localStorage.getItem('currentAppEnvironmentIdForOauth'),
        }),
      }),
    requestOptions
  ).then(handleResponse);
}

function fetchOauth2BaseUrl(provider) {
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify({ provider }) };
  return fetch(`${config.apiUrl}/data_sources/fetch_oauth2_base_url`, requestOptions).then(handleResponse);
}
