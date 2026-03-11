import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workspaceBranchesService = {
  list,
  create,
  switchBranch,
  deleteBranch,
  pushWorkspace,
  pullWorkspace,
  checkForUpdates,
  listRemoteBranches,
};

function list() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/workspace-branches`, requestOptions).then(handleResponse);
}

function create(name, sourceBranchId) {
  const body = { name, ...(sourceBranchId && { sourceBranchId }) };
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

function pushWorkspace(commitMessage, targetBranch) {
  const body = { commitMessage, ...(targetBranch && { targetBranch }) };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workspace-branches/push`, requestOptions).then(handleResponse);
}

function pullWorkspace(sourceBranch) {
  const body = sourceBranch ? { sourceBranch } : undefined;
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    ...(body && { body: JSON.stringify(body) }),
  };
  return fetch(`${config.apiUrl}/workspace-branches/pull`, requestOptions).then(handleResponse);
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
