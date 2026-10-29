import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { appendBranchParam } from '@/_helpers/active-branch';

export const gitSyncService = {
  create,
  validatePush,
  getGitConfig,
  updateConfig,
  updateBranchingEnabled,
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
  getAppGitConfigs,
  // New branch management methods
  getAllBranches,
  createBranch,
  getPullRequests,
  switchBranch,
  updateGitConfigs,
  getGitConfigs,
  checkTagExists,
  // Git-aware version save/delete (backend creates/deletes the git tag as part of the same call).
  saveVersion,
  deleteVersion,
  updateEnvConfigs,
  testProviderConnection,
  // Auto-sync webhook management
  provisionWebhook,
  enableAutoSync,
  updateAutoSyncEvents,
  disableAutoSync,
  rotateAutoSyncSecret,
  getAutoSyncStatus,
  getAutoSyncEvents,
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

// Toggles only the workspace branching mode. Hits the dedicated endpoint so the config
// save flow no longer carries the branching flag.
function updateBranchingEnabled(organizationGitId, isBranchingEnabled) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ isBranchingEnabled }),
  };
  return fetch(`${config.apiUrl}/git-sync/${organizationGitId}/is-branching-enabled`, requestOptions).then(
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
  return fetch(`${config.apiUrl}/git-sync/${workspaceId}/status`, requestOptions).then((response) =>
    handleResponse(response, false, null, true)
  );
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

function gitPush(body, appId, versionId) {
  // body can now include { commitMessage, sourceBranch } when branching is enabled
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  // gitpush is guarded by AppResourceGuard which reads user.branchId from the query.
  return fetch(appendBranchParam(`${config.apiUrl}/app-git/gitpush/${appId}/${versionId}`), requestOptions).then(
    handleResponse
  );
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

function gitPull(branch, currentBranchId) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  const queryParams = new URLSearchParams();
  if (branch) queryParams.set('branch', branch);
  if (currentBranchId) queryParams.set('currentBranchId', currentBranchId);
  const queryString = queryParams.toString();
  return fetch(`${config.apiUrl}/app-git/gitpull${queryString ? `?${queryString}` : ''}`, requestOptions).then(
    handleResponse
  );
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

function updateEnvConfigs(useEnvConfig, provider) {
  const body = {
    useEnvConfig,
    provider,
  };
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/git-sync/env-configs`, requestOptions).then(handleResponse);
}

function testProviderConnection(payload = {}) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(payload),
  };

  return fetch(`${config.apiUrl}/git-sync/test-connection`, requestOptions).then(handleResponse);
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
  return fetch(`${config.apiUrl}/app-git/${organizationId}/app/${appId}/branches`, requestOptions).then((response) =>
    handleResponse(response, false, null, true)
  );
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
    (response) => handleResponse(response, false, null, true)
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

// NOTE: createGitTag was removed. Git-tag creation is now owned by the backend save-version flow.

/**
 * Save (publish) a version in a GIT-ENABLED workspace. Hits the app-git endpoint, which performs the
 * DB save AND creates the git tag in one call (server-side). Body is identical to
 * appVersionService.save — callers use this instead of appVersionService.save when git sync is on.
 */
function saveVersion(appId, versionId, values, isUserSwitchedVersion = false) {
  const body = { is_user_switched_version: isUserSwitchedVersion };
  if (values.definition) body['definition'] = values.definition;
  if (values.name) body['name'] = values.name;
  if (values.diff) body['app_diff'] = values.diff;
  if (values.description !== undefined && values.description !== null) body['description'] = values.description;
  if (values.status) body['status'] = values.status;

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/app-git/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

/**
 * Delete a version in a GIT-ENABLED workspace. Hits the app-git endpoint, which performs the DB
 * delete AND removes the git tag in one call (server-side).
 */
function deleteVersion(appId, versionId) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/${appId}/versions/${versionId}`, requestOptions).then(handleResponse);
}

/**
 * Check if a git tag already exists for the given app and version name.
 * This should be called BEFORE saving the version locally to ensure
 * local save and tag creation stay in sync.
 * @param {string} appId - Application ID
 * @param {string} versionName - Version name to check
 * @returns {Promise<{ exists: boolean, tag_name: string }>} Promise resolving to tag existence check
 */
function checkTagExists(appId, versionName) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(
    `${config.apiUrl}/app-git/${appId}/check-tag?versionName=${encodeURIComponent(versionName)}`,
    requestOptions
  ).then(handleResponse);
}
function validatePush(appId, resourceType = 'app') {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/app-git/validate-push/${appId}?resourceType=${resourceType}`, requestOptions).then(
    handleResponse
  );
}

// Remove all app-git api's to separate service from here.

// Auto-sync webhook management

function provisionWebhook() {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/auto-sync/provision`, requestOptions).then(handleResponse);
}

function enableAutoSync(selectedEvents) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ events: selectedEvents }),
  };
  return fetch(`${config.apiUrl}/git-sync/auto-sync/enable`, requestOptions).then(handleResponse);
}

function updateAutoSyncEvents(selectedEvents) {
  const requestOptions = {
    method: 'PATCH',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ events: selectedEvents }),
  };
  return fetch(`${config.apiUrl}/git-sync/auto-sync/events`, requestOptions).then(handleResponse);
}

function disableAutoSync() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/auto-sync/disable`, requestOptions).then(handleResponse);
}

function rotateAutoSyncSecret() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/auto-sync/rotate-secret`, requestOptions).then(handleResponse);
}

function getAutoSyncStatus() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/auto-sync/status`, requestOptions).then(handleResponse);
}

function getAutoSyncEvents(page = 1, limit = 20) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/git-sync/auto-sync/events?page=${page}&limit=${limit}`, requestOptions).then(
    handleResponse
  );
}
