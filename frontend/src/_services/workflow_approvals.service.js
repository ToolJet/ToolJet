import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { toLocalDayBoundary } from '@/_helpers/dateRange';

export const workflowApprovalsService = {
  getAll,
  resolveById,
  cancel,
};

function getAll(filters = {}, page = 1, perPage = 25, signal) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('per_page', perPage);
  (filters.statuses || []).forEach((status) => params.append('status', status));
  if (filters.appId) params.set('app_id', filters.appId);
  if (filters.folderId) params.set('folder_id', filters.folderId);
  if (filters.environmentId) params.set('environment_id', filters.environmentId);
  if (filters.approver) params.set('approver', filters.approver);
  if (filters.from) params.set('from', toLocalDayBoundary(filters.from, 'start'));
  if (filters.to) params.set('to', toLocalDayBoundary(filters.to, 'end'));

  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include', signal };
  return fetch(`${config.apiUrl}/workflow-approvals?${params.toString()}`, requestOptions).then(handleResponse);
}

function resolveById(id, outcome, input = {}) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ outcome, input }),
  };
  return fetch(`${config.apiUrl}/workflow-approvals/by-id/${id}/resolve`, requestOptions).then(handleResponse);
}

function cancel(id) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow-approvals/${id}/cancel`, requestOptions).then(handleResponse);
}
