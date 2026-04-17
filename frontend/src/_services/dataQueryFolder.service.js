import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const dataQueryFolderService = {
  getAll,
  create,
  rename,
  del,
  reorder,
  batchReorder,
};

function getAll(appVersionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/data-query-folders?appVersionId=${appVersionId}`, requestOptions).then(handleResponse);
}

function create(name, appVersionId) {
  const body = { name, appVersionId };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data-query-folders`, requestOptions).then(handleResponse);
}

function rename(id, name) {
  const body = { name };
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data-query-folders/${id}`, requestOptions).then(handleResponse);
}

function del(id, mode) {
  const body = { mode };
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/data-query-folders/${id}`, requestOptions).then(handleResponse);
}

function reorder(childId, childType, newIndex, parentId) {
  const body = { childId, childType, newIndex, parentId };
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data-query-folders/reorder`, requestOptions).then(handleResponse);
}

function batchReorder(items) {
  const body = { items };
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/data-query-folders/batch-reorder`, requestOptions).then(handleResponse);
}
