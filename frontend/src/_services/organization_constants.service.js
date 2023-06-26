import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const orgEnvironmentConstantService = {
  getAll,
  create,
  update,
  remove,
};

function getAll() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-constants`, requestOptions).then(handleResponse);
}

function create({ name, value, environment }) {
  const body = {
    constant_name: name,
    value: value,
    environment_id: environment,
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

function remove(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-constants/${id}`, requestOptions).then(handleResponse);
}
