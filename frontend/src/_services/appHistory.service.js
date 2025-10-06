import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const appHistoryService = {
  getHistory,
  restoreToEntry,
  updateDescription,
  streamHistoryUpdates,
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

function restoreToEntry(historyId) {
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

async function streamHistoryUpdates(appVersionId, onMessage, onError = () => {}) {
  const controller = new AbortController();
  fetchEventSource(`${config.apiUrl}/app-history-sse/apps/versions/${appVersionId}/stream`, {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
    signal: controller.signal,
    onmessage: (event) => {
      if (onMessage) onMessage(event);
    },
  }).catch((error) => {
    if (onError) onError(error);
  });

  return controller;
}
