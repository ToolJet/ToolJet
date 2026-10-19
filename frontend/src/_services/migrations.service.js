import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const migrationsService = {
  getStatus,
  getRuns,
  retry,
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

function retry() {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/migration-runs/retry`, requestOptions).then(handleResponse);
}
