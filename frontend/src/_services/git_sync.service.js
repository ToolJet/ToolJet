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
};

function create(organizationId, gitUrl) {
  const body = {
    organizationId,
    gitUrl,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync`, requestOptions).then(handleResponse);
}

function updateConfig(organizationGitId, updateParam) {
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
  return fetch(`${config.apiUrl}/git-sync/${organizationGitId}`, requestOptions).then(handleResponse);
}

function updateStatus(organizationGitId, isEnabled) {
  const body = {
    isEnabled,
  };
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/status/${organizationGitId}`, requestOptions).then(handleResponse);
}

function setFinalizeConfig(organizationGitId) {
  const controller = new AbortController();
  const timeOut = 2500;
  const id = setTimeout(() => controller.abort(), timeOut);
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    signal: controller.signal,
  };

  const response = fetch(`${config.apiUrl}/git-sync/finalize/${organizationGitId}`, requestOptions).then(
    handleResponse
  );
  clearTimeout(id);
  return response;
}

function getGitConfig(workspaceId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/${workspaceId}`, requestOptions).then(handleResponse);
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

function deleteConfig(organizationGitId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/${organizationGitId}`, requestOptions).then(handleResponse);
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
