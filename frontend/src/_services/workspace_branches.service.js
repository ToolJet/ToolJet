import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const workspaceBranchesService = {
  list,
  create,
  switchBranch,
  deleteBranch,
  pushWorkspace,
  pullWorkspace,
  pullApp,
  pullModule,
  ensureAppDraft,
  checkForUpdates,
  listRemoteBranches,
  fetchPullRequests,
  getEntityTags,
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

function pushWorkspace(commitMessage, targetBranch, branchId, { deletionOnly, scope } = {}) {
  const body = {
    commitMessage,
    ...(targetBranch && { targetBranch }),
    ...(branchId && { branchId }),
    ...(deletionOnly && { deletionOnly }),
    ...(scope && { scope }),
  };
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

function pullApp(appId, branchId, tagSha, tagName, tagDescription) {
  const body = {
    appId,
    ...(branchId && { branchId }),
    ...(tagSha && { tagSha }),
    ...(tagName && { tagName }),
    ...(tagDescription && { tagDescription }),
  };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workspace-branches/pull-app`, requestOptions).then(handleResponse);
}

function pullModule(moduleId, tagSha, tagName, tagDescription, branchId) {
  const body = {
    moduleId,
    ...(branchId && { branchId }),
    ...(tagSha && { tagSha }),
    ...(tagName && { tagName }),
    ...(tagDescription && { tagDescription }),
  };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/workspace-branches/pull-module`, requestOptions).then(handleResponse);
}

function ensureAppDraft(appId, branchId, tagSha, tagName) {
  const body = {
    appId,
    ...(branchId && { branchId }),
    ...(tagSha && { tagSha }),
    ...(tagName && { tagName }),
  };
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

function getEntityTags(coRelationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    `${config.apiUrl}/workspace-branches/entity-tags?coRelationId=${encodeURIComponent(coRelationId)}`,
    requestOptions
  ).then(handleResponse);
}
