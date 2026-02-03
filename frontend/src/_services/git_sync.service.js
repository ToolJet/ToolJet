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
  checkForUpdatesByAppName,
  confirmPullChanges,
  updateStatus,
  getGitStatus,
  saveProviderConfigs,
  updateAppEditState,
  getAppGitConfigs,
  // New branch management methods
  getAllBranches,
  createBranch,
  getPullRequests,
  switchBranch,
  updateGitConfigs,
  getGitConfigs,
  createGitTag,
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
  const { gitUrl, autoCommit, keyType, branchingEnabled } = updateParam;
  const body = {
    ...(gitUrl && { gitUrl }),
    ...(autoCommit != null && { autoCommit }),
    ...(keyType && { keyType }),
    ...(branchingEnabled && { branchingEnabled }),
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
  // body can now include { commitMessage, sourceBranch } when branching is enabled
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/app-git/gitpush/${appGitId}/${versionId}`, requestOptions).then(handleResponse);
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
  const response = fetch(`${config.apiUrl}/app-git/${organizationId}/app/${versionId}`, requestOptions).then(
    handleResponse
  );
  clearTimeout(id);
  return response;
}

function checkForUpdates(appId, branchName = '') {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/gitpull/app/${appId}?branch=${branchName}`, requestOptions).then(
    handleResponse
  );
}

function checkForUpdatesByAppName(appName, branchName = '') {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  const params = new URLSearchParams();
  if (appName) params.append('appName', appName);
  if (branchName) params.append('branch', branchName);
  return fetch(`${config.apiUrl}/app-git/gitpull/app?${params.toString()}`, requestOptions).then(handleResponse);
}

function gitPull() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/gitpull`, requestOptions).then(handleResponse);
}

function confirmPullChanges(body, appId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/app-git/gitpull/app/${appId}`, requestOptions).then(handleResponse);
}

function importGitApp(body) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/app-git/gitpull/app`, requestOptions).then(handleResponse);
}

function setFinalizeConfig(organizationGitId, body) {
  const controller = new AbortController();
  const timeOut = 2500;
  const id = setTimeout(() => controller.abort(), timeOut);
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    signal: controller.signal,
    body: JSON.stringify(body),
  };
  const response = fetch(`${config.apiUrl}/git-sync/finalize/${organizationGitId}`, requestOptions).then(
    handleResponse
  );
  clearTimeout(id);
  return response;
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
  return fetch(`${config.apiUrl}/app-git/${appId}/configs`, requestOptions).then(handleResponse);
}
function getAppGitConfigs(workspaceId, versionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/app-git/${workspaceId}/app/${versionId}/configs`, requestOptions).then(handleResponse);
}

// Branch Management API Methods

/**
 * Get all branches for an app
 * @param {string} appId - Application ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise} Promise resolving to branches array
 */
function getAllBranches(appId, organizationId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/${organizationId}/app/${appId}/branches`, requestOptions).then(handleResponse);
}

/**
 * Create a new branch
 * @param {string} appId - Application ID
 * @param {string} organizationId - Organization ID
 * @param {object} branchData - { branch_name, version_from_id, auto_commit }
 * @returns {Promise} Promise resolving to created branch
 */
function createBranch(appId, organizationId, branchData) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(branchData),
  };
  return fetch(`${config.apiUrl}/app-git/${organizationId}/app/${appId}/branches`, requestOptions).then(handleResponse);
}

/**
 * Get pull requests for an app
 * @param {string} appId - Application ID
 * @returns {Promise} Promise resolving to pull requests array
 */
function getPullRequests(appId, organizationId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/${organizationId}/app/${appId}/pull-requests`, requestOptions).then(
    handleResponse
  );
}

/**
 * Switch to a different branch (pull commits from branch)
 * @param {string} appId - Application ID
 * @param {string} branchName - Target branch name
 * @returns {Promise} Promise resolving to pull result
 */
function switchBranch(appId, branchName) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/gitpull/app/${appId}?branch=${branchName}`, requestOptions).then(
    handleResponse
  );
}

/**
 * Update git configurations (including branching enabled status)
 * @param {string} appId - Application ID
 * @param {object} configs - Configuration object { branching_enabled, ...otherConfigs }
 * @returns {Promise} Promise resolving to updated configs
 */
function updateGitConfigs(appId, configs) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(configs),
  };
  return fetch(`${config.apiUrl}/app-git/${appId}/configs`, requestOptions).then(handleResponse);
}

/**
 * Get git configurations for an app version
 * @param {string} organizationId - Organization ID
 * @param {string} versionId - Version ID
 * @returns {Promise} Promise resolving to git configs
 */
function getGitConfigs(organizationId, versionId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/${organizationId}/app/${versionId}/configs`, requestOptions).then(
    handleResponse
  );
}

function createGitTag(appId, versionId, versionDescription) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ message: versionDescription }),
  };
  return fetch(`${config.apiUrl}/app-git/${appId}/versions/${versionId}/tag`, requestOptions).then(handleResponse);
}
// Remove all app-git api's to separate service from here.
