import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const orgEnvironmentConstantService = {
  getAll,
  create,
  update,
  remove,
  getConstantsFromEnvironment,
  getConstantsFromApp,
  getConstantsFromPublicApp,
  getAllSecrets,
};

function getAll(type = null) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const queryParams = type ? `?type=${type}` : '';
  return fetch(`${config.apiUrl}/organization-constants/decrypted${queryParams}`, requestOptions).then(handleResponse);
}

function create(name, value, type, environments) {
  const body = {
    constant_name: name,
    value: value,
    type: type,
    environments: environments,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization-constants`, requestOptions).then(handleResponse);
}

function update(id, value, environmentId) {
  const body = {
    value,
    environment_id: environmentId,
  };

  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization-constants/${id}`, requestOptions).then(handleResponse);
}

function remove(id, environmentId) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-constants/${id}?environmentId=${environmentId}`, requestOptions).then(
    handleResponse
  );
}

function getConstantsFromEnvironment(environmentId, type = null) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const queryParams = type ? `?type=${type}` : '';
  return fetch(
    `${config.apiUrl}/organization-constants/environment/${environmentId}${queryParams}`,
    requestOptions
  ).then(handleResponse);
}

function getAllSecrets() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-constants/secrets`, requestOptions).then(handleResponse);
}

function getConstantsFromApp(slug, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const queryParams = environmentId ? `?environmentId=${environmentId}` : '';
  return fetch(`${config.apiUrl}/organization-constants/${slug}${queryParams}`, requestOptions).then(handleResponse);
}

function getConstantsFromPublicApp(slug, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const queryParams = environmentId ? `?environmentId=${environmentId}` : '';
  return fetch(`${config.apiUrl}/organization-constants/public/${slug}${queryParams}`, requestOptions).then(
    handleResponse
  );
}
