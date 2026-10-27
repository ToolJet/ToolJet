import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const auditLogsService = { index, getLicenseTerms, getMaxDurationForAuditLogs, getResources };

const skipUpgradeModal = (response) => handleResponse(response, false, null, true);

function index(params) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/audit-logs?` + new URLSearchParams(params), requestOptions).then(skipUpgradeModal);
}

function getLicenseTerms() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/audit-logs/license-terms`, requestOptions).then(skipUpgradeModal);
}

function getMaxDurationForAuditLogs() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/audit-logs/max-duration`, requestOptions).then(skipUpgradeModal);
}

function getResources() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/audit-logs/resources`, requestOptions).then(skipUpgradeModal);
}
