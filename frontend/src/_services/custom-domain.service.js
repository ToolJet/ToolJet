import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

function getCustomDomain() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-domains`, requestOptions).then(handleResponse);
}

function createCustomDomain(domain) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ domain }),
  };
  return fetch(`${config.apiUrl}/custom-domains`, requestOptions).then(handleResponse);
}

function verifyCustomDomain() {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-domains/verify`, requestOptions).then(handleResponse);
}

function deleteCustomDomain() {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-domains`, requestOptions).then(handleResponse);
}

function getCustomDomainStatus() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-domains/status`, requestOptions).then(handleResponse);
}

function resolveCustomDomain(domain) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/custom-domains/resolve?domain=${encodeURIComponent(domain)}`, requestOptions).then(
    handleResponse
  );
}

export const customDomainService = {
  getCustomDomain,
  createCustomDomain,
  verifyCustomDomain,
  deleteCustomDomain,
  getCustomDomainStatus,
  resolveCustomDomain,
};
