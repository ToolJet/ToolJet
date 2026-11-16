import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

// Workspace personal access tokens — ONE species for every consuming feature (CLI, MCP, ...).
// USER-scoped management of WORKSPACE-bound tokens; expiry is a caller-picked FUTURE date.
export const personalAccessTokensService = {
  list,
  create,
  remove,
};

function list() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/personal-access-tokens`, requestOptions).then(handleResponse);
}

// The token binds to the current workspace server-side. expiresAt: ISO date string — required, must be in the future (server enforces).
function create({ name, expiresAt }) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ name, expiresAt }),
  };
  return fetch(`${config.apiUrl}/personal-access-tokens`, requestOptions).then(handleResponse);
}

function remove(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/personal-access-tokens/${id}`, requestOptions).then(handleResponse);
}
