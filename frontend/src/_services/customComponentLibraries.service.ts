import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';

interface StreamDevBundleUpdatesOptions {
  onMessage?: (event: EventSourceMessage) => void;
  onError?: (error: unknown) => void;
}

export interface CustomComponentLibraryRevision {
  id: string;
  version: string;
  createdAt?: string;
}

export interface CustomComponentLibraryDevBundle {
  userId: string;
  userEmail?: string;
}

export interface CustomComponentLibrary {
  id: string;
  name: string;
  correlationId?: string;
  revisions: CustomComponentLibraryRevision[];
  devBundles?: CustomComponentLibraryDevBundle[];
}

function list(): Promise<CustomComponentLibrary[]> {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' as const };
  return fetch(`${config.apiUrl}/custom-component-libraries`, requestOptions).then(handleResponse);
}

function deleteLibrary(id: string) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include' as const };
  return fetch(`${config.apiUrl}/custom-component-libraries/${id}`, requestOptions).then(handleResponse);
}

// One SSE connection per (libraryId, userId); caller aborts it via the returned controller.
async function streamDevBundleUpdates(
  libraryId: string,
  userId: string,
  { onMessage, onError = () => {} }: StreamDevBundleUpdatesOptions = {}
) {
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

export const customComponentLibrariesService = {
  list,
  deleteLibrary,
  streamDevBundleUpdates,
};
