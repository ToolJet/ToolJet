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

function getAll(appVersionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/workflow-schedules?app_version_id=${appVersionId}`, requestOptions).then(
    handleResponse
  );
}

function getById(id) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/workflow-schedules/${id}`, requestOptions).then(handleResponse);
}

function create(workflowId, active, environmentId, type, timezone, details) {
  const body = {
    workflowId,
    active,
    environmentId,
    type,
    timezone,
    details,
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

function update(id, active, environmentId, type, timezone, details) {
  const body = {
    active,
    environmentId,
    type,
    timezone,
    details,
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
