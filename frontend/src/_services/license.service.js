import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const licenseService = {
  get,
  update,
  getFeatureAccess,
  getDomainsList,
  getLicenseStatus,
};

function getLicenseStatus() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/license/status`, requestOptions).then(handleResponse);
}

function get() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse);
}

async function update(body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  const updatedData = await fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse);
  return updatedData;
}

function getFeatureAccess() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/access`, requestOptions).then(handleResponse);
}

function getDomainsList() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/domains`, requestOptions).then(handleResponse);
}
