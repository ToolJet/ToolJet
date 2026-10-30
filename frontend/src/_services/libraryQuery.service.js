import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

// Keep the wire DTO camelCase; adapt it once for existing editor consumers.
const editorQuery = ({ dataSourceId, folderId, createdAt, updatedAt, ...query }) => ({
  ...query,
  data_source_id: dataSourceId,
  folder_id: folderId,
  folderMapping: { id: query.id, childId: query.id, childType: 'query', parentId: folderId, index: 0 },
  created_at: createdAt,
  updated_at: updatedAt,
});
const request = (path, method = 'GET', body, context = {}, signal) =>
  fetch(`${config.apiUrl}/query-library/${path}`, {
    method,
    headers: authHeader(false, context.workspaceId),
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
  }).then(handleResponse);
const versions = (id) => `queries/${id}/versions`;

export const libraryQueryService = {
  listStaticDataSources: (context) => request('static-data-sources', 'GET', undefined, context),
  list: (context) => request('queries', 'GET', undefined, context).then((queries) => queries.map(editorQuery)),
  create: (body, context) => request('queries', 'POST', body, context).then(editorQuery),
  update: (id, body, context) => request(`queries/${id}`, 'PATCH', body, context).then(editorQuery),
  changeDataSource: (id, dataSourceId, context) =>
    request(`queries/${id}/data-source`, 'PUT', { dataSourceId }, context).then(editorQuery),
  del: (id, context) => request(`queries/${id}`, 'DELETE', undefined, context),
  run: (id, environmentId, body = {}, signal, context) =>
    request(`queries/${id}/run/${environmentId}`, 'POST', body, context, signal),
  getCatalog: (context) => request('catalog', 'GET', undefined, context),
  getUsage: (context) => request('usage', 'GET', undefined, context),
  getVersions: (id, context) => request(versions(id), 'GET', undefined, context),
  saveVersion: (id, body = {}, context) => request(`${versions(id)}/save`, 'POST', body, context),
  createDraft: (id, body = {}, context) => request(`${versions(id)}/draft`, 'POST', body, context),
  discardDraft: (id, context) => request(`${versions(id)}/draft`, 'DELETE', undefined, context),
  promote: (id, versionId, context) => request(`${versions(id)}/${versionId}/promote`, 'POST', undefined, context),
  release: (id, versionId, context) => request(`${versions(id)}/${versionId}/release`, 'POST', undefined, context),
  deleteVersion: (id, versionId, context) => request(`${versions(id)}/${versionId}`, 'DELETE', undefined, context),
  listFolders: (context) => request('folders', 'GET', undefined, context),
  createFolder: (name, context) => request('folders', 'POST', { name }, context),
  renameFolder: (id, name, context) => request(`folders/${id}`, 'PATCH', { name }, context),
  deleteFolder: (id, context) => request(`folders/${id}`, 'DELETE', undefined, context),
};
