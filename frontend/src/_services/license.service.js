import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const licenseService = {
  get,
  update,
  getFeatureAccess,
  getDomainsList,
};

function get() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse);
}

function update(body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse);
}

function getFeatureAccess() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/access`, requestOptions).then(handleResponse);
}

function getDomainsList() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/domains`, requestOptions).then(handleResponse);
}
