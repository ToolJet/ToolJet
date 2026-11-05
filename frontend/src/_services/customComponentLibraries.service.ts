import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';
import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';

interface StreamDevBundleUpdatesOptions {
  onMessage?: (event: EventSourceMessage) => void;
  onError?: (error: unknown) => void;
}

export interface CustomComponentLibraryRevision {
  id: string;
  version: string;
  createdAt?: string;
}

// Who built a dev preview, by user id only: the list reaches every workspace member.
export interface CustomComponentLibraryDevBundle {
  userId: string;
}

export interface CustomComponentLibrary {
  id: string;
  name: string;
  correlationId?: string;
  revisions: CustomComponentLibraryRevision[];
  devBundles?: CustomComponentLibraryDevBundle[];
  manifest?: LibraryManifest; // the latest revision's manifest, embedded so callers can skip a fetch for the common case
  // Set when the list left that manifest's embedded source out; its manifest file still has it.
  manifestSourceOmitted?: boolean;
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
