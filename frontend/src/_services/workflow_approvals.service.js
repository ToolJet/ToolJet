import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workflowApprovalsService = {
  getAll,
  resolveById,
  cancel,
};

/**
 * `<input type="date">` yields a bare `YYYY-MM-DD`: a calendar day in the *user's* timezone, with
 * nothing on it to say so. Sent as-is it is read as a UTC instant at midnight, which as an upper
 * bound excludes the whole day the user picked — "to today" returns nothing created today.
 *
 * So convert the picked day into the instants it actually spans locally and send those, offset
 * included. `new Date(y, m, d, …)` constructs in local time; `toISOString()` renders the instant.
 * The server applies the same widening to a bare date as a fallback for any other API consumer
 * (`server/src/modules/workflows/helpers/approval-date-range.ts`), but only the browser knows the
 * viewer's timezone, so the page is what resolves it. A value that already carries a time is
 * passed straight through.
 */
function toLocalDayBoundary(value, edge) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date =
    edge === 'start' ? new Date(year, monthIndex, day, 0, 0, 0, 0) : new Date(year, monthIndex, day, 23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

// `signal` lets a caller abort a superseded request (e.g. the approvals page re-querying
// before a previous filter/page request resolved) — see ApprovalsPage's `load()`.
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
