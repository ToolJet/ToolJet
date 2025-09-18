import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appHistoryService = {
  getHistory,
  restoreToEntry,
  updateDescription,
};

function getHistory(appVersionId, page = 0, limit = 20) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/app-history/apps/versions/${appVersionId}?${queryParams}`, requestOptions).then(
    handleResponse
  );
}

function restoreToEntry(appVersionId, historyId) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/app-history/${historyId}/restore`, requestOptions).then(handleResponse);
}

function updateDescription(historyId, data) {
  const requestOptions = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  };

  return fetch(`${config.apiUrl}/app-history/${historyId}`, requestOptions).then(handleResponse);
}
