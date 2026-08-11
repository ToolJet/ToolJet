import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const customComponentLibrariesService = {
  list,
  listTokens,
  createToken,
  deleteToken,
};

// B9: libraries + revisions (newest first) + latest manifest + dev bundles.
// Session-guarded — the builder user browses with their cookie, not a CLI token.
function list() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries`, requestOptions).then(handleResponse);
}

// A1: personal access tokens — USER-scoped management of workspace-bound CLI tokens.
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
