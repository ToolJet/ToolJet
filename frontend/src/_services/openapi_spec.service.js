import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const openApiSpecService = {
  upload,
  getStatus,
  cancel,
  getMetadata,
  getOperations,
  getOperation,
};

function baseUrl(dataSourceId) {
  return `${config.apiUrl}/data-sources/${dataSourceId}/openapi-spec`;
}

function upload(dataSourceId, { sourceType, url, definition, environmentId }) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceType, url, definition, environmentId }),
    credentials: 'include',
  };
  return fetch(baseUrl(dataSourceId), requestOptions).then(handleResponse);
}

function getStatus(dataSourceId, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${baseUrl(dataSourceId)}/status?environmentId=${environmentId}`, requestOptions).then(handleResponse);
}

function cancel(dataSourceId, environmentId) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${baseUrl(dataSourceId)}/cancel?environmentId=${environmentId}`, requestOptions).then(handleResponse);
}

function getMetadata(dataSourceId, environmentId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${baseUrl(dataSourceId)}/metadata?environmentId=${environmentId}`, requestOptions).then(handleResponse);
}

function getOperations(dataSourceId, environmentId, { service, tag, search, page, perPage } = {}) {
  const params = new URLSearchParams({ environmentId });
  if (service) params.set('service', service);
  if (tag) params.set('tag', tag);
  if (search) params.set('search', search);
  if (page) params.set('page', page);
  if (perPage) params.set('perPage', perPage);

  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  // Response shape: { meta: { totalPages, totalCount, currentPage }, operations: [...] }.
  return fetch(`${baseUrl(dataSourceId)}/operations?${params.toString()}`, requestOptions).then(handleResponse);
}

function getOperation(dataSourceId, environmentId, operationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    `${baseUrl(dataSourceId)}/operations/${encodeURIComponent(operationId)}?environmentId=${environmentId}`,
    requestOptions
  ).then(handleResponse);
}
