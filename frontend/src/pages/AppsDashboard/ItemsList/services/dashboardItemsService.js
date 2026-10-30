import config from 'config';
import queryString from 'query-string';
import { authHeader, handleResponse } from '@/_helpers';
import { appendBranchParam } from '@/_helpers/active-branch';
import { mockDashboardItemsApi } from './dashboardItemsMock';

// Flip once the backend implements the /dashboard/items contract.
const USE_MOCK_DASHBOARD_API = true;

const toQueryString = ({ type, page, perPage, sort, releaseStatus, visibility, searchKey }) =>
  queryString.stringify(
    { type, page, per_page: perPage, sort, release_status: releaseStatus, visibility, searchKey },
    { arrayFormat: 'comma', skipEmptyString: true }
  );

function getRootItems(params, { signal } = {}) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include', signal };
  return fetch(appendBranchParam(`${config.apiUrl}/dashboard/items?${toQueryString(params)}`), requestOptions).then(
    handleResponse
  );
}

function getFolderItems(folderId, params, { signal } = {}) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include', signal };
  return fetch(
    appendBranchParam(`${config.apiUrl}/dashboard/folders/${folderId}/items?${toQueryString(params)}`),
    requestOptions
  ).then(handleResponse);
}

export const dashboardItemsService = USE_MOCK_DASHBOARD_API ? mockDashboardItemsApi : { getRootItems, getFolderItems };
