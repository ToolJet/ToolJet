import config from 'config';
import { authHeader, handleResponseForSSL as handleResponse, getApiUrl } from '@/_helpers';

export const sslService = {
  getConfig,
  updateConfig,
  validatePrerequisites,
  getCertificateStatus,
  acquireCertificate,
  requestDomainChange,
  cancelDomainChange,
};

function getConfig() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${getApiUrl()}/ssl`, requestOptions).then(handleResponse);
}

function updateConfig(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  return fetch(`${getApiUrl()}/ssl`, requestOptions).then(handleResponse);
}

function validatePrerequisites() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${getApiUrl()}/ssl/validate`, requestOptions).then(handleResponse);
}

function getCertificateStatus() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${getApiUrl()}/ssl/certificate/status`, requestOptions).then(handleResponse);
}

function acquireCertificate() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${getApiUrl()}/ssl/certificate/acquire`, requestOptions).then(handleResponse);
}

function requestDomainChange(newDomain) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ newDomain }),
  };
  return fetch(`${getApiUrl()}/ssl/domain/change`, requestOptions).then(handleResponse);
}

function cancelDomainChange() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${getApiUrl()}/ssl/domain/cancel-change`, requestOptions).then(handleResponse);
}
