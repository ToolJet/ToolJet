import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const gitSyncService = {
  create,
  getGitConfig,
  updateConfig,
  syncAppVersion,
  setFinalizeConfig,
  deleteConfig,
  getAppConfig,
  gitPush,
  gitPull,
  importGitApp,
  checkForUpdates,
  confirmPullChanges,
  updateStatus,
  getGitStatus,
  saveProviderConfigs,
  updateAppEditState,
  getAppGitConfigs,
};

function create(organizationId, gitUrl, gitType) {
  const body = {
    organizationId,
    gitUrl,
    gitType,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync`, requestOptions).then(handleResponse);
}

function updateConfig(organizationGitId, updateParam, gitType = '') {
  const { gitUrl, autoCommit, keyType } = updateParam;
  const body = {
    ...(gitUrl && { gitUrl }),
    ...(autoCommit != null && { autoCommit }),
    ...(keyType && { keyType }),
  };
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/${organizationGitId}?gitType=${gitType}`, requestOptions).then(
    handleResponse
  );
}

function updateStatus(organizationGitId, isEnabled, gitType) {
  const body = {
    isEnabled,
    gitType,
  };
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/status/${organizationGitId}`, requestOptions).then(handleResponse);
}

function setFinalizeConfig(organizationGitId, gitType) {
  const controller = new AbortController();
  const timeOut = 2500;
  const id = setTimeout(() => controller.abort(), timeOut);
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    signal: controller.signal,
  };

  const response = fetch(
    `${config.apiUrl}/git-sync/finalize/${organizationGitId}?gitType=${gitType}`,
    requestOptions
  ).then(handleResponse);
  clearTimeout(id);
  return response;
}

function getGitConfig(workspaceId, gitType = '') {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/${workspaceId}?gitType=${gitType}`, requestOptions).then(handleResponse);
}

function getGitStatus(workspaceId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/${workspaceId}/status`, requestOptions).then(handleResponse);
}

function syncAppVersion(appGitId, versionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/${appGitId}/sync/${versionId}`, requestOptions).then(handleResponse);
}

function deleteConfig(organizationGitId, gitType) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/${organizationGitId}?gitType=${gitType}`, requestOptions).then(
    handleResponse
  );
}

function gitPush(body, appGitId, versionId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/gitpush/${appGitId}/${versionId}`, requestOptions).then(handleResponse);
}

function getAppConfig(organizationId, versionId) {
  const controller = new AbortController();
  const timeOut = 2500;
  const id = setTimeout(() => controller.abort(), timeOut);
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
    signal: controller.signal,
  };
  const response = fetch(`${config.apiUrl}/git-sync/${organizationId}/app/${versionId}`, requestOptions).then(
    handleResponse
  );
  clearTimeout(id);
  return response;
}

function checkForUpdates(appId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/gitpull/app/${appId}`, requestOptions).then(handleResponse);
}

function gitPull() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/gitpull`, requestOptions).then(handleResponse);
}

function confirmPullChanges(body, appId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/gitpull/app/${appId}`, requestOptions).then(handleResponse);
}

function importGitApp(body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/gitpull/app`, requestOptions).then(handleResponse);
}
function saveProviderConfigs(body) {
  // TO DO Later : Review if we need to use abort controller for this api request
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/configs`, requestOptions).then(handleResponse);
}

function updateAppEditState(appId, allowEditing) {
  const body = {
    allowEditing,
  };
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/appGit/${appId}`, requestOptions).then(handleResponse);
}
function getAppGitConfigs(workspaceId, versionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/git-sync/${workspaceId}/app/${versionId}/configs`, requestOptions).then(
    handleResponse
  );
}
// Remove all app-git api's to separate service from here.
