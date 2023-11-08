import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appVersionService = {
  getAll,
  getOne,
  getAppVersionData,
  create,
  del,
  save,
  autoSaveApp,
  saveAppVersionEventHandlers,
  createAppVersionEventHandler,
  deleteAppVersionEventHandler,
  clonePage,
  findAllEventsWithSourceId,
};

function getAll(appId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${appId}/versions`, requestOptions).then(handleResponse);
}

function getOne(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}
function getAppVersionData(appId, versionId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/v2/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function create(appId, versionName, versionFromId) {
  const body = {
    versionName,
    versionFromId,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions`, requestOptions).then(handleResponse);
}

function del(appId, versionId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function save(appId, versionId, values, isUserSwitchedVersion = false) {
  const body = { is_user_switched_version: isUserSwitchedVersion };
  if (values.definition) body['definition'] = values.definition;
  if (values.name) body['name'] = values.name;
  if (values.diff) body['app_diff'] = values.diff;

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/apps/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

function autoSaveApp(
  appId,
  versionId,
  diff,
  type,
  pageId,
  operation,
  isUserSwitchedVersion = false,
  isComponentCutProcess = false
) {
  const OPERATION = {
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE',
  };

  const bodyMappings = {
    pages: {
      create: { ...diff },
      delete: { ...diff },
    },
    global_settings: {
      update: { ...diff },
    },
  };

  const body = !type
    ? { ...diff }
    : bodyMappings[type]?.[operation] || {
        is_user_switched_version: isUserSwitchedVersion,
        pageId,
        diff,
      };

  if (type === 'components' && operation === 'delete' && isComponentCutProcess) {
    body['is_component_cut'] = true;
  }

  const requestOptions = {
    method: OPERATION[operation],
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };

  const url = `${config.apiUrl}/v2/apps/${appId}/versions/${versionId}/${type ?? ''}`;

  return fetch(url, requestOptions).then(handleResponse);
}

function saveAppVersionEventHandlers(appId, versionId, events, updateType = 'update') {
  const body = {
    events,
    updateType,
  };

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/apps/${appId}/versions/${versionId}/events`, requestOptions).then(handleResponse);
}

function createAppVersionEventHandler(appId, versionId, event) {
  const body = {
    ...event,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/v2/apps/${appId}/versions/${versionId}/events`, requestOptions).then(handleResponse);
}

function deleteAppVersionEventHandler(appId, versionId, eventId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/apps/${appId}/versions/${versionId}/events/${eventId}`, requestOptions).then(
    handleResponse
  );
}

function clonePage(appId, versionId, pageId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/v2/apps/${appId}/versions/${versionId}/pages/${pageId}/clone`, requestOptions).then(
    handleResponse
  );
}

function findAllEventsWithSourceId(appId, versionId, sourceId = undefined) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  return fetch(
    `${config.apiUrl}/v2/apps/${appId}/versions/${versionId}/events${sourceId ? `?sourceId=${sourceId}` : ''}
  `,
    requestOptions
  ).then(handleResponse);
}
