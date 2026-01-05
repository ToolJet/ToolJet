import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workflowBundlesService = {
  getPackages,
  updatePackages,
  getInstalledPackages,
  getPackageStatus,
  updateExistingPackages,
};

function getPackages(searchTerm, language = 'javascript') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const url = `${config.apiUrl}/workflows/packages/${language}/search?q=${encodeURIComponent(searchTerm)}&limit=50`;
  return fetch(url, requestOptions).then(handleResponse);
}

function updatePackages(workflowId, body, language = 'javascript') {
  const requestOptions = { method: 'PUT', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/workflows/${workflowId}/packages/${language}`, requestOptions).then(handleResponse);
}

function getInstalledPackages(workflowId, language = 'javascript') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflows/${workflowId}/packages/${language}`, requestOptions).then(handleResponse);
}

function getPackageStatus(workflowId, signal, language = 'javascript') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  if (signal) requestOptions.signal = signal;
  return fetch(`${config.apiUrl}/workflows/${workflowId}/bundle/${language}/status`, requestOptions).then(handleResponse);
}

function updateExistingPackages(workflowId, language = 'javascript') {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify({}) };
  return fetch(`${config.apiUrl}/workflows/${workflowId}/bundle/${language}/rebuild`, requestOptions).then(handleResponse);
}
