import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const orgConstantsV2Service = {
  list,
  get,
  create,
  update,
  bulkDelete,
};

const baseUrl = () => `${config.apiUrl}/v2/organization-constants`;

function list({ environmentId, type, search, source, sort, page, perPage }, { signal } = {}) {
  const query = new URLSearchParams();
  const params = {
    environment_id: environmentId,
    type,
    search,
    source: source?.join(','),
    sort,
    page,
    per_page: perPage,
  };
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });

  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include', signal };
  return fetch(`${baseUrl()}?${query}`, requestOptions).then(handleResponse);
}

function get(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${baseUrl()}/${encodeURIComponent(id)}`, requestOptions).then(handleResponse);
}

function create(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(baseUrl(), requestOptions).then(handleResponse);
}

function update(id, body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${baseUrl()}/${encodeURIComponent(id)}`, requestOptions).then(handleResponse);
}

function bulkDelete(ids) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ids }),
  };
  return fetch(`${baseUrl()}/bulk-delete`, requestOptions).then(handleResponse);
}
