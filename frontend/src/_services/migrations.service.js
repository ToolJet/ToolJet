import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const migrationsService = {
  getStatus,
  getRuns,
  getLog,
  run,
};

const IDLE = { state: 'idle' };

// Public, polled by every tab. Skips handleResponse: any failure is just "idle", never a logout/redirect.
function getStatus() {
  return fetch(`${config.apiUrl}/migration-status`)
    .then((res) => (res.ok ? res.json() : IDLE))
    .then((data) => data || IDLE)
    .catch(() => IDLE);
}

function getRuns() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/migration-runs`, requestOptions).then(handleResponse);
}

/** Starts waiting (manual mode) or failed migrations. */
function run() {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/migration-runs/run`, requestOptions).then(handleResponse);
}

/** Whole run, or one migration's lines when `migration` is given. */
function getLog(runId, migration) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = migration ? `?migration=${encodeURIComponent(migration)}` : '';
  return fetch(`${config.apiUrl}/migration-runs/${runId}/log${query}`, requestOptions)
    .then(handleResponse)
    .then((data) => data?.log ?? '');
}
