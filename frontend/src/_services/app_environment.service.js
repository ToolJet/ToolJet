import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appEnvironmentService = {
  getAllEnvironments,
  create,
  update,
  deleteEnv,
};

function getAllEnvironments(versionId) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/app-environments${versionId ? `/${versionId}` : ''}`, requestOptions).then(
    handleResponse
  );
}

function create(name, versionId) {
  const body = {
    name,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/app-environments/${versionId}`, requestOptions).then(handleResponse);
}

function update(id, versionId, name) {
  const body = {
    name,
  };

  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/app-environments/${versionId}/update/${id}`, requestOptions).then(handleResponse);
}

function deleteEnv(id, versionId) {
  const requestOptions = { method: 'DELETE', headers: authHeader() };
  return fetch(`${config.apiUrl}/app-environments/${versionId}/delete/${id}`, requestOptions).then(handleResponse);
}
