import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const migrationsService = {
  getStatus,
  getRuns,
  getLog,
};

const IDLE = { state: 'idle' };
// No banner, but the banner keeps polling: an upgrade may be what made the call fail.
const UNKNOWN = { state: 'unknown' };

// Public, polled by every tab. Skips handleResponse: a failure is never a logout/redirect.
function getStatus() {
  return fetch(`${config.apiUrl}/migration-status`)
    .then((res) => (res.ok ? res.json() : UNKNOWN))
    .then((data) => data || IDLE)
    .catch(() => UNKNOWN);
}

function getRuns() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/migration-runs`, requestOptions).then(handleResponse);
}

/** Whole run, or one migration's lines when `migration` is given. */
function getLog(runId, migration) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = migration ? `?migration=${encodeURIComponent(migration)}` : '';
  return fetch(`${config.apiUrl}/migration-runs/${runId}/log${query}`, requestOptions)
    .then(handleResponse)
    .then((data) => data?.log ?? '');
}
