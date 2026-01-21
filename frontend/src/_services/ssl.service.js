import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const sslService = {
  getConfig,
  updateConfig,
  validatePrerequisites,
  getCertificateStatus,
  acquireCertificate,
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
