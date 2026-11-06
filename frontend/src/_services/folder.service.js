import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { getAuthRequestOptions } from '@/_helpers/authRequestOptions';
import { appendBranchParam, getActiveBranchId } from '@/_helpers/active-branch';

export const folderService = {
  create,
  deleteFolder,
  bulkDeleteFolders,
  getAll,
  addToFolder,
  bulkAddToFolder,
  bulkMoveAppsToFolder,
  bulkRemoveAppsFromFolder,
  removeAppFromFolder,
  updateFolder,
};

function getAll(searchKey = '', type = 'front-end') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const url = `${config.apiUrl}/folder-apps?searchKey=${searchKey}&type=${type}`;
  return fetch(appendBranchParam(url), requestOptions).then(handleResponse);
}

function create(name, type) {
  const body = {
    name,
    type,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folders`, requestOptions).then(handleResponse);
}

function updateFolder(name, id) {
  const body = {
    name,
  };

  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/folders/${id}`, requestOptions).then(handleResponse);
}

function deleteFolder(id) {
  const requestOptions = {
    method: 'DELETE',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/folders/${id}`, requestOptions).then(handleResponse);
}

// All or nothing: responds 200 `{ blocked_ids }`; a non-empty list means nothing was deleted.
// `mode`: 'folder_only' moves the folders' apps to root; 'folder_and_apps' also deletes the ones the user can delete.
function bulkDeleteFolders({ folderIds, mode, appType }) {
  const body = { folder_ids: folderIds, mode, type: appType, branch_id: getActiveBranchId() };
  return fetch(`${config.apiUrl}/v2/folders/bulk-delete`, getAuthRequestOptions('POST', body)).then(handleResponse);
}

// All or nothing: responds 200 `{ blocked_ids }`; a non-empty list means nothing was moved.
// The backend takes each app out of its current folder, so the source folder isn't sent.
function bulkMoveAppsToFolder({ appIds, folderId }) {
  const body = { app_ids: appIds, folder_id: folderId, branch_id: getActiveBranchId() };
  return fetch(`${config.apiUrl}/v2/folder-apps/bulk-move`, getAuthRequestOptions('POST', body)).then(handleResponse);
}

// All or nothing: responds 200 `{ blocked_ids }`; a non-empty list means nothing was removed.
// The backend finds each app's folder, so none is sent; apps already at root are skipped, not blocked.
function bulkRemoveAppsFromFolder({ appIds, appType }) {
  const body = { app_ids: appIds, type: appType, branch_id: getActiveBranchId() };
  return fetch(`${config.apiUrl}/v2/folder-apps/bulk-remove`, getAuthRequestOptions('POST', body)).then(handleResponse);
}

function bulkAddToFolder(appIds, folderId) {
  const body = { app_ids: appIds, folder_id: folderId };
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  const url = `${config.apiUrl}/folder-apps`;
  return fetch(appendBranchParam(url), requestOptions).then(handleResponse);
}

function addToFolder(appId, folderId) {
  const body = {
    app_id: appId,
    folder_id: folderId,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  // Single-add is used for front-end apps; carry the active branch.
  return fetch(appendBranchParam(`${config.apiUrl}/folder-apps`), requestOptions).then(handleResponse);
}

function removeAppFromFolder(appId, folderId) {
  const body = { app_id: appId };
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  const url = `${config.apiUrl}/folder-apps/${folderId}`;
  return fetch(appendBranchParam(url), requestOptions).then(handleResponse);
}
