import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { authenticationService } from '@/_services';

export const workflowExecutionsService = {
  create,
  triggerEditor,
  getStatus,
  getWorkflowExecution,
  execute,
  all,
  enableWebhook,
  previewQueryNode,
  getPaginatedExecutions,
  getPaginatedNodes,
  trigger,
  streamSSE,
  terminate,
  getExecutionStates,
  getWorkspaceExecutions,
  getWorkspaceExecutionStates,
  getUpcomingRuns,
};

function previewQueryNode(queryId, appVersionId, nodeId, state = {}, environmentId) {
  const currentSession = authenticationService.currentSessionValue;
  const body = {
    appVersionId,
    userId: currentSession.current_user?.id,
    queryId,
    nodeId,
    state,
    appEnvId: environmentId,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions/previewQueryNode`, requestOptions).then(handleResponse);
}

function create(appVersionId, testJson, environmentId, extraProps = {}) {
  const { injectedState = {}, startNodeId } = extraProps;
  const currentSession = authenticationService.currentSessionValue;
  const body = {
    environmentId,
    appVersionId,
    userId: currentSession.current_user?.id,
    executeUsing: 'version',
    params: testJson,
    injectedState,
    startNodeId,
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

function getPaginatedExecutions(appVersionId, page = 1, perPage = 10) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    `${config.apiUrl}/workflow_executions?appVersionId=${appVersionId}&page=${page}&per_page=${perPage}`,
    requestOptions
  ).then(handleResponse);
}

function getPaginatedNodes(executionId, page = 1, perPage = 20) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    `${config.apiUrl}/workflow_executions/${executionId}/nodes?page=${page}&per_page=${perPage}`,
    requestOptions
  ).then(handleResponse);
}

function trigger(workflowAppId, params, environmentId, queryId, syncExecution = true, workflowVersionId = null) {
  const currentSession = authenticationService.currentSessionValue;
  const body = {
    appId: workflowAppId,
    userId: currentSession.current_user?.id,
    executeUsing: 'app',
    params: Array.isArray(params)
      ? Object.fromEntries(params.filter((param) => param.key !== '').map((param) => [param.key, param.value]))
      : params || {},
    environmentId,
    queryId,
    syncExecution,
    ...(workflowVersionId ? { appVersionId: workflowVersionId } : {}),
  };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions/${workflowAppId}/trigger`, requestOptions).then(handleResponse);
}

function triggerEditor(appVersionId, testJson, environmentId, extraProps = {}) {
  const { injectedState = {}, startNodeId } = extraProps;
  const currentSession = authenticationService.currentSessionValue;

  const body = {
    appVersionId: appVersionId,
    userId: currentSession.current_user?.id,
    executeUsing: 'version',
    params: testJson || {},
    environmentId,
    injectedState,
    startNodeId,
    syncExecution: true, // Workflow builder always runs synchronously
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
    credentials: 'include',
  };

  // Use appVersionId in URL path for trigger endpoint
  return fetch(`${config.apiUrl}/workflow_executions/${appVersionId}/trigger`, requestOptions).then(handleResponse);
}

function terminate(executionId) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workflow_executions/${executionId}/terminate`, requestOptions).then(handleResponse);
}

function streamSSE(workflowExecutionId) {
  return new EventSource(`${config.apiUrl}/workflow_executions/${workflowExecutionId}/stream`, {
    withCredentials: true,
  });
}

function getExecutionStates(appVersionId, executionIds) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ executionIds }),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/workflow_executions/states?appVersionId=${appVersionId}`, requestOptions).then(
    handleResponse
  );
}

/**
 * `<input type="date">` yields a bare `YYYY-MM-DD`: a calendar day in the *user's* timezone, with
 * nothing on it to say so. Sent as-is, the repository's `created_at <= :to` casts it to midnight,
 * which as an upper bound excludes the whole day the user picked — From = To = today returns
 * nothing.
 *
 * So convert the picked day into the instant it actually spans locally and send that, offset
 * included. `new Date(y, m, d, …)` constructs in local time; `toISOString()` renders the instant.
 * Only the browser knows the viewer's timezone, so the page is what resolves it. Same approach as
 * `workflow_approvals.service.js`'s `toLocalDayBoundary`, which this mirrors — a value that
 * already carries a time is passed straight through.
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

// `signal` lets a caller abort a superseded request (the executions page re-querying before a
// previous filter/page request resolved).
function getWorkspaceExecutions(filters = {}, page = 1, perPage = 15, signal) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('per_page', perPage);
  (filters.statuses || []).forEach((status) => params.append('status', status));
  (filters.triggers || []).forEach((trigger) => params.append('trigger', trigger));
  if (filters.appId) params.set('app_id', filters.appId);
  if (filters.folderId) params.set('folder_id', filters.folderId);
  if (filters.environmentId) params.set('environment_id', filters.environmentId);
  if (filters.from) params.set('from', toLocalDayBoundary(filters.from, 'start'));
  if (filters.to) params.set('to', toLocalDayBoundary(filters.to, 'end'));

  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include', signal };
  return fetch(`${config.apiUrl}/workflow_executions/workspace?${params.toString()}`, requestOptions).then(
    handleResponse
  );
}

function getWorkspaceExecutionStates(executionIds) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ executionIds }),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/workflow_executions/workspace/states`, requestOptions).then(handleResponse);
}

/**
 * Scheduled runs that have not happened yet.
 *
 * Deliberately not part of `getWorkspaceExecutions`: an upcoming run has no `workflow_executions`
 * row at all, so it cannot appear in a list built from that table. Only the environment narrows it
 * — status, trigger and date filters are history concepts that mean nothing for a future run.
 */
function getUpcomingRuns(environmentId, signal) {
  const params = new URLSearchParams();
  if (environmentId) params.set('environment_id', environmentId);

  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include', signal };
  return fetch(`${config.apiUrl}/workflow_executions/workspace/upcoming?${params.toString()}`, requestOptions).then(
    handleResponse
  );
}
