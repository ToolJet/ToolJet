import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const datasourceService = {
  create,
  getAll,
  deleteDataSource,
  test,
  setOauth2Token,
  save,
  fetchOauth2BaseUrl,
};

function getAll(appId, appVersionId) {
  const requestOptions = { method: 'GET', headers: authHeader() };

  let searchParams = new URLSearchParams(`app_id=${appId}`);
  appVersionId && searchParams.append('app_version_id', appVersionId);

  return fetch(`${config.apiUrl}/data_sources?` + searchParams, requestOptions).then(handleResponse);
}

function create(app_id, app_version_id, name, kind, options) {
  const body = {
    app_id,
    app_version_id,
    name,
    kind,
    options,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_sources`, requestOptions).then(handleResponse);
}

function save(id, app_id, name, options) {
  const body = {
    app_id,
    name,
    options,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_sources/${id}`, requestOptions).then(handleResponse);
}

function deleteDataSource(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader() };
  return fetch(`${config.apiUrl}/data_sources/${id}`, requestOptions).then(handleResponse);
}

function test(kind, options) {
  const body = {
    kind,
    options,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_sources/test_connection`, requestOptions).then(handleResponse);
}

function setOauth2Token(dataSourceId, body) {
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data_sources/${dataSourceId}/authorize_oauth2`, requestOptions).then(handleResponse);
}

function fetchOauth2BaseUrl(provider) {
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify({ provider }) };
  return fetch(`${config.apiUrl}/data_sources/fetch_oauth2_base_url`, requestOptions).then(handleResponse);
}
