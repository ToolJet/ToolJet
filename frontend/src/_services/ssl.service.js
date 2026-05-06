import config from 'config';
import { authHeader, handleResponseForSSL as handleResponse } from '@/_helpers';

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

function getCertificateStatus() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/ssl/certificate/status`, requestOptions).then(handleResponse);
}

function acquireCertificate() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/ssl/certificate/acquire`, requestOptions).then(handleResponse);
}

function requestDomainChange(newDomain) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ newDomain }),
  };
  return fetch(`${config.apiUrl}/ssl/domain/change`, requestOptions).then(handleResponse);
}

function cancelDomainChange() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/ssl/domain/cancel-change`, requestOptions).then(handleResponse);
}
