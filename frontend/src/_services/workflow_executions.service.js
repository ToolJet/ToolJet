import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { authenticationService } from '@/_services';

export const workflowExecutionsService = {
  create,
  getStatus,
  execute,
};

function create(appVersionId) {
  const currentSession = authenticationService.currentSessionValue;
  const body = { appVersionId, userId: currentSession.current_user?.id, executeUsing: 'version' };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/workflow_executions`, requestOptions).then(handleResponse);
}

function getStatus(workflowExecutionId) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/workflow_executions/${workflowExecutionId}`, requestOptions).then(handleResponse);
}

function execute(appId) {
  const currentSession = authenticationService.currentSessionValue;
  const body = { appId, userId: currentSession.current_user?.id, executeUsing: 'app' };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/workflow_executions`, requestOptions).then(handleResponse);
}
