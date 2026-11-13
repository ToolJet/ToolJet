import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

import type {
  BulkDeleteConstantsResult,
  ConstantDetail,
  ConstantsListResponse,
  CreateConstantBody,
  ListConstantsParams,
  UpdateConstantBody,
} from './types/organizationConstantsV2.types';

const baseUrl = () => `${config.apiUrl}/v2/organization-constants`;

function list(
  { environmentId, type, search, source, sort, page, perPage }: ListConstantsParams,
  { signal }: { signal?: AbortSignal } = {}
): Promise<ConstantsListResponse> {
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
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });

  const requestOptions: RequestInit = { method: 'GET', headers: authHeader(), credentials: 'include', signal };
  return fetch(`${baseUrl()}?${query}`, requestOptions).then(handleResponse);
}

function get(id: string): Promise<ConstantDetail> {
  const requestOptions: RequestInit = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${baseUrl()}/${encodeURIComponent(id)}`, requestOptions).then(handleResponse);
}

function create(body: CreateConstantBody): Promise<ConstantDetail> {
  const requestOptions: RequestInit = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(baseUrl(), requestOptions).then(handleResponse);
}

function update(id: string, body: UpdateConstantBody): Promise<ConstantDetail> {
  const requestOptions: RequestInit = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${baseUrl()}/${encodeURIComponent(id)}`, requestOptions).then(handleResponse);
}

function bulkDelete(ids: string[]): Promise<BulkDeleteConstantsResult> {
  const requestOptions: RequestInit = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ids }),
  };
  return fetch(`${baseUrl()}/bulk-delete`, requestOptions).then(handleResponse);
}

export const orgConstantsV2Service = {
  list,
  get,
  create,
  update,
  bulkDelete,
};
