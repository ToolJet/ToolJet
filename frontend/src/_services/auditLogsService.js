import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const auditLogsService = { index };

function index(params) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
  };

  return fetch(`${config.apiUrl}/audit_logs?` + new URLSearchParams(params), requestOptions).then(handleResponse);
}
