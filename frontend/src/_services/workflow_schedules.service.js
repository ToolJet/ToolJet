import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workflowSchedulesService = {
  create,
  getAll,
  getById,
  update,
  remove,
  activateWorkflowSchedule,
};

function getAll(appId, pagination) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  const query = new URLSearchParams({ app_id: appId });
  if (pagination) {
    query.set('page', pagination.page);
    query.set('limit', pagination.limit);
    if (pagination.search) query.set('search', pagination.search);
    if (pagination.environmentId) query.set('environment_id', pagination.environmentId);
    if (pagination.workflowId) query.set('workflow_id', pagination.workflowId);
  }
  return fetch(`${config.apiUrl}/workflow-schedules?${query.toString()}`, requestOptions).then(handleResponse);
}

function getById(id) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/workflow-schedules/${id}`, requestOptions).then(handleResponse);
}

function create(workflowId, name, active, environmentId, type, timezone, details, params) {
  const body = {
    workflowId,
    name,
    active,
    environmentId,
    type,
    timezone,
    details,
    params,
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workflow-schedules`, requestOptions).then(handleResponse);
}

function update(id, name, active, environmentId, type, timezone, details, workflowId, params) {
  const body = {
    name,
    active,
    environmentId,
    type,
    timezone,
    details,
    params,
  };

  if (workflowId) {
    body.workflowId = workflowId;
  }

  const requestOptions = {
    method: 'PUT',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workflow-schedules/${id}`, requestOptions).then(handleResponse);
}

function activateWorkflowSchedule(id, active) {
  const body = {
    active,
  };

  const requestOptions = {
    method: 'PUT',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  };

  return fetch(`${config.apiUrl}/workflow-schedules/activate/${id}`, requestOptions).then(handleResponse);
}

function remove(id) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/workflow-schedules/${id}`, requestOptions).then(handleResponse);
}
