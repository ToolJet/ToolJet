import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const sslService = {
  getConfig,
  updateConfig,
  validatePrerequisites,
};

function getConfig() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ssl`, requestOptions).then(handleResponse);
}

function updateConfig(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  return fetch(`${config.apiUrl}/ssl`, requestOptions).then(handleResponse);
}

function validatePrerequisites() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/ssl/validate`, requestOptions).then(handleResponse);
}
