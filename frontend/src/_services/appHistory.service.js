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
  fetchEventSource(`${config.apiUrl}/app-history/apps/versions/${appVersionId}/stream`, {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
    signal: controller.signal,
    onmessage: (event) => {
      if (onMessage) onMessage(event);
    },
    onerror: (error) => {
      // Don't retry if aborted
      if (controller.signal.aborted) {
        throw error; // This stops fetchEventSource from retrying
      }
      if (onError) onError(error);
    },
  }).catch((error) => {
    // Only log if not aborted (expected behavior)
    if (!controller.signal.aborted) {
      console.error('[AppHistory] SSE connection error:', error);
      if (onError) onError(error);
    }
  });

  return controller;
}
