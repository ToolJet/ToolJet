import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const auditLogsService = { index, getLicenseTerms, getMaxDurationForAuditLogs };

function index(params) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/audit-logs?` + new URLSearchParams(params), requestOptions).then(handleResponse);
}

function getLicenseTerms() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/audit-logs/license-terms`, requestOptions).then(handleResponse);
}

function getMaxDurationForAuditLogs() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/audit-logs/max-duration`, requestOptions).then(handleResponse);
}
