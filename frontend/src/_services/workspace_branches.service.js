import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workspaceBranchesService = {
  list,
  create,
  switchBranch,
  deleteBranch,
  pushWorkspace,
  pullWorkspace,
  ensureAppDraft,
  checkForUpdates,
  listRemoteBranches,
  fetchPullRequests,
};

function list() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workspace-branches`, requestOptions).then((response) =>
    handleResponse(response, false, null, true)
  );
}

function create(name, sourceBranchId, commitSha) {
  const body = { name, ...(sourceBranchId && { sourceBranchId }), ...(commitSha && { commitSha }) };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workspace-branches`, requestOptions).then(handleResponse);
}

function switchBranch(branchId, appId) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    ...(appId && { body: JSON.stringify({ appId }) }),
  };
  return fetch(`${config.apiUrl}/workspace-branches/${branchId}/activate`, requestOptions).then(handleResponse);
}

function deleteBranch(branchId) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workspace-branches/${branchId}`, requestOptions).then(handleResponse);
}

function pushWorkspace(commitMessage, targetBranch, branchId) {
  const body = { commitMessage, ...(targetBranch && { targetBranch }), ...(branchId && { branchId }) };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workspace-branches/push`, requestOptions).then(handleResponse);
}

function pullWorkspace(sourceBranch, branchId) {
  const body = {
    ...(sourceBranch && { sourceBranch }),
    ...(branchId && { branchId }),
  };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    ...(Object.keys(body).length > 0 && { body: JSON.stringify(body) }),
  };
  return fetch(`${config.apiUrl}/workspace-branches/pull`, requestOptions).then(handleResponse);
}

function ensureAppDraft(appId, branchId) {
  const body = { appId, ...(branchId && { branchId }) };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workspace-branches/ensure-draft`, requestOptions).then(handleResponse);
}

function checkForUpdates(branch) {
  const params = branch ? `?branch=${encodeURIComponent(branch)}` : '';
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workspace-branches/check-updates${params}`, requestOptions).then(handleResponse);
}

function listRemoteBranches() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workspace-branches/remote`, requestOptions).then(handleResponse);
}

function fetchPullRequests() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workspace-branches/pull-requests`, requestOptions).then(handleResponse);
}
