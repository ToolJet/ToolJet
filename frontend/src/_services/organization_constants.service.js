import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const orgEnvironmentConstantService = {
  getAll,
  create,
  update,
  remove,
  getConstantsFromEnvironment,
  getConstantsFromPublicApp,
};

function getAll(decryptValue = false) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-constants?decryptValue=${decryptValue}`, requestOptions).then(
    handleResponse
  );
}

function create(name, value, environments) {
  const body = {
    constant_name: name,
    value: value,
    environments: environments,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization-constants`, requestOptions).then(handleResponse);
}

function update(id, value, envronmentId) {
  const body = {
    value,
    environment_id: envronmentId,
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

function getConstantsFromEnvironment(environmentId, decryptValue = false) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    `${config.apiUrl}/organization-constants/environment/${environmentId}?decryptValue=${decryptValue}`,
    requestOptions
  ).then(handleResponse);
}

function getConstantsFromPublicApp(slug, decryptValue = false) {
  const requestOptions = { method: 'GET' };
  return fetch(`${config.apiUrl}/organization-constants/${slug}?decryptValue=${decryptValue}`, requestOptions).then(
    handleResponse
  );
}
