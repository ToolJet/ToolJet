import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const customComponentLibrariesService = {
  list,
  deleteLibrary,
  streamDevBundleUpdates,
};

function list() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries`, requestOptions).then(handleResponse);
}

function deleteLibrary(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries/${id}`, requestOptions).then(handleResponse);
}

// Live-reload push for the dev-preview track. One SSE connection per (libraryId, userId);
// returns an AbortController so the caller can tear it down when the dev preview is cleared or switched.
async function streamDevBundleUpdates(libraryId, userId, { onMessage, onError = () => {} } = {}) {
  const controller = new AbortController();

  fetchEventSource(`${config.apiUrl}/custom-component-libraries/${libraryId}/dev/${userId}/stream`, {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
    signal: controller.signal,
    onmessage: (event) => {
      if (event.event === 'dev-bundle-updated' && onMessage) onMessage(event);
    },
    onerror: (error) => {
      if (controller.signal.aborted) {
        throw error; // stops fetchEventSource from retrying
      }
      onError(error);
    },
  }).catch((error) => {
    if (!controller.signal.aborted) onError(error);
  });

  return controller;
}
