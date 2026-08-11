import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const customComponentLibrariesService = {
  list,
  deleteLibrary,
  listTokens,
  createToken,
  deleteToken,
};

function list() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries`, requestOptions).then(handleResponse);
}

function deleteLibrary(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries/${id}`, requestOptions).then(handleResponse);
}

function listTokens() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries/tokens`, requestOptions).then(handleResponse);
}

// expiresInDays: 7 | 30 | 60 | 90 | null (null/undefined = never expires)
function createToken({ name, organizationId, expiresInDays }) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ name, organizationId, expiresInDays }),
  };
  return fetch(`${config.apiUrl}/custom-component-libraries/tokens`, requestOptions).then(handleResponse);
}

function deleteToken(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries/tokens/${id}`, requestOptions).then(handleResponse);
}
