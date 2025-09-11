import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workflowBundlesService = {
  getPackages,
  updatePackages,
  getInstalledPackages,
  getPackageStatus,
  updateExistingPackages,
};

function getPackages(searchTerm) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const url = `${config.apiUrl}/workflows/packages/search?q=${encodeURIComponent(searchTerm)}&limit=50`;
  return fetch(url, requestOptions).then(handleResponse);
}

function updatePackages(workflowId, body) {
  const requestOptions = { method: 'PUT', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/workflows/${workflowId}/packages`, requestOptions).then(handleResponse);
}

function getInstalledPackages(workflowId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflows/${workflowId}/packages`, requestOptions).then(handleResponse);
}

function getPackageStatus(workflowId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflows/${workflowId}/bundle/status`, requestOptions).then(handleResponse);
}

function updateExistingPackages(workflowId) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify({}) };
  return fetch(`${config.apiUrl}/workflows/${workflowId}/bundle/rebuild`, requestOptions).then(handleResponse);
}
