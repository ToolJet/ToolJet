import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { authenticationService } from '@/_services';

export const workflowExecutionsService = {
  create,
  getStatus,
  getWorkflowExecution,
  execute,
  all,
  enableWebhook,
  previewQueryNode,
};

function previewQueryNode(queryId, appVersionId, nodeId) {
  const currentSession = authenticationService.currentSessionValue;
  const body = { appVersionId, userId: currentSession.current_user?.id, queryId, nodeId };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions/previewQueryNode`, requestOptions).then(handleResponse);
}

function create(appVersionId, testJson, environmentId) {
  const currentSession = authenticationService.currentSessionValue;
  const body = {
    environmentId,
    appVersionId,
    userId: currentSession.current_user?.id,
    executeUsing: 'version',
    params: testJson,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions`, requestOptions).then(handleResponse);
}

function getStatus(workflowExecutionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions/${workflowExecutionId}/status`, requestOptions).then(
    handleResponse
  );
}

function getWorkflowExecution(workflowExecutionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions/${workflowExecutionId}`, requestOptions).then(handleResponse);
}

function all(appVersionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions/all/${appVersionId}`, requestOptions).then(handleResponse);
}

function execute(workflowAppId, params, appId = undefined, environmentId) {
  const currentSession = authenticationService.currentSessionValue;
  const body = {
    appId: workflowAppId,
    app: appId,
    userId: currentSession.current_user?.id,
    executeUsing: 'app',
    params: Object.fromEntries(params.map((param) => [param.key, param.value])),
    environmentId,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions`, requestOptions).then(handleResponse);
}

function enableWebhook(appId, value) {
  const body = {
    isEnable: value,
  };
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/v2/webhooks/workflows/${appId}`, requestOptions).then(handleResponse);
}
