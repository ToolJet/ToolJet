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
};

function previewQueryNode(queryId, appVersionId, nodeId, state = {}) {
  const currentSession = authenticationService.currentSessionValue;
  const body = { appVersionId, userId: currentSession.current_user?.id, queryId, nodeId, state };
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

function getPaginatedExecutions(appVersionId, page = 1, perPage = 10, workflowId = null, sortBy, sortOrder, filters = null) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const baseParams = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (workflowId) {
    baseParams.set('workflow_id', workflowId);
  }

  if (sortBy) {
    baseParams.set('sort_by', sortBy);
  }

  if (sortOrder) {
    baseParams.set('sort_order', sortOrder);
  }

  // Add filters to query params
  if (filters) {
    // Status filter (multiple selection)
    if (filters.status && filters.status.length > 0) {
      baseParams.set('status', filters.status.join(','));
    }
    
    // Trigger filter (multiple selection)
    if (filters.trigger && filters.trigger.length > 0) {
      baseParams.set('trigger', filters.trigger.join(','));
    }
    
    // Started at filter (single selection - converts to date range)
    if (filters.startedAt) {
      const now = new Date();
      let startDate, endDate;
      
      switch (filters.startedAt) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
          break;
        case 'last7days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          endDate = now;
          break;
        case 'last30days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          endDate = now;
          break;
      }
      
      if (startDate) {
        baseParams.set('started_at_start', startDate.toISOString());
      }
      if (endDate) {
        baseParams.set('started_at_end', endDate.toISOString());
      }
    }
    
    // Date filter (explicit date range)
    if (filters.date) {
      if (filters.date.start) {
        baseParams.set('started_at_start', new Date(filters.date.start).toISOString());
      }
      if (filters.date.end) {
        // Set end date to end of day
        const endDate = new Date(filters.date.end);
        endDate.setHours(23, 59, 59, 999);
        baseParams.set('started_at_end', endDate.toISOString());
      }
    }
    
    // Duration filter (single selection - converts to min/max seconds)
    if (filters.duration) {
      let minSeconds, maxSeconds;
      
      switch (filters.duration) {
        case 'less1min':
          minSeconds = 0;
          maxSeconds = 59;
          break;
        case '1-5min':
          minSeconds = 60;
          maxSeconds = 300;
          break;
        case '5-15min':
          minSeconds = 300;
          maxSeconds = 900;
          break;
        case '15-30min':
          minSeconds = 900;
          maxSeconds = 1800;
          break;
        case '30+min':
          minSeconds = 1800;
          maxSeconds = null; // No upper limit
          break;
      }
      
      if (minSeconds !== undefined) {
        baseParams.set('duration_min', minSeconds);
      }
      if (maxSeconds !== null && maxSeconds !== undefined) {
        baseParams.set('duration_max', maxSeconds);
      }
    }
  }

  if (!appVersionId) {
    const url = `${config.apiUrl}/workflow_executions/organization/all?${baseParams.toString()}`;
    return fetch(url, requestOptions).then(handleResponse);
  }
  return fetch(
    `${config.apiUrl}/workflow_executions?appVersionId=${appVersionId}&${baseParams.toString()}`,
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

function trigger(workflowAppId, params, environmentId, queryId, syncExecution = true) {
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
    credentials: 'include'
  };

  // Use appVersionId in URL path for trigger endpoint
  return fetch(`${config.apiUrl}/workflow_executions/${appVersionId}/trigger`, requestOptions)
    .then(handleResponse);
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
    credentials: 'include'
  };
  return fetch(
    `${config.apiUrl}/workflow_executions/states?appVersionId=${appVersionId}`,
    requestOptions
  ).then(handleResponse);
}
