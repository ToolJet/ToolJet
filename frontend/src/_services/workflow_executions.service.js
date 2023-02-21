import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workflowExecutionsService = {
  create,
};

function create(appVersionId) {
  const body = { appVersionId };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/workflow_executions`, requestOptions).then(handleResponse);
}
