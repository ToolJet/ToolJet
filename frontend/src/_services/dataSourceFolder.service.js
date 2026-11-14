import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { appendBranchParam } from '@/_helpers/active-branch';

// Folder `type` discriminator for data-source folders (mirrors the backend
// DATA_SOURCE_FOLDER_TYPE in server/src/modules/folders/constants). App folders use the
// APP_TYPES values instead; data sources are deliberately their own type.
const DATA_SOURCE_FOLDER_TYPE = 'data_source';

export const dataSourceFolderService = {
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  addToFolder,
  bulkAddToFolder,
  removeFromFolder,
};

// Lists data-source folders with their contents for the active Git branch. Returns only folders
// and the data sources inside them — stray (unfoldered) data sources come from
// globalDatasourceService.getAll() and are merged client-side. The backend resolves the org's
// default branch when no branch_id is present (non-git workspaces).
function getFolders(searchKey = '') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const url = `${config.apiUrl}/folder-data-sources?searchKey=${encodeURIComponent(searchKey)}`;
  return fetch(appendBranchParam(url), requestOptions).then(handleResponse);
}

// Folder CRUD hits the shared /folders endpoints (not branch-scoped — the folders row has no
// branch; only its membership rows do). `type: 'data_source'` routes it to the data-source
// folder permission model on the backend.
function createFolder(name) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ name, type: DATA_SOURCE_FOLDER_TYPE }),
  };
  return fetch(`${config.apiUrl}/folders`, requestOptions).then(handleResponse);
}

function renameFolder(name, id) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ name }),
  };
  return fetch(`${config.apiUrl}/folders/${id}`, requestOptions).then(handleResponse);
}

function deleteFolder(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/folders/${id}`, requestOptions).then(handleResponse);
}

// Add a single data source to a folder. Idempotent and auto-moving: if the data source already
// belongs to another folder on this branch, the backend moves it (one folder per DS per branch),
// so this doubles as the single-item "move" call.
function addToFolder(dataSourceId, folderId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ folder_id: folderId, data_source_id: dataSourceId }),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/folder-data-sources`), requestOptions).then(handleResponse);
}

// Add/move multiple data sources to a folder in one request (multi-select drag, "Add to folder"
// modal). Same auto-move semantics as addToFolder for any DS already foldered elsewhere.
function bulkAddToFolder(dataSourceIds, folderId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ folder_id: folderId, data_source_ids: dataSourceIds }),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/folder-data-sources`), requestOptions).then(handleResponse);
}

// Remove a data source from a folder (it becomes a stray data source again on this branch).
function removeFromFolder(dataSourceId, folderId) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ data_source_id: dataSourceId }),
  };
  return fetch(appendBranchParam(`${config.apiUrl}/folder-data-sources/${folderId}`), requestOptions).then(
    handleResponse
  );
}
