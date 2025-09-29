import config from 'config';
import { authHeader } from '@/_helpers';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const appHistorySSEService = {
  streamHistoryUpdates,
};

async function streamHistoryUpdates(appVersionId, onMessage, onError, onOpen, onClose) {
  const controller = new AbortController();

  try {
    console.log('[SSE] Establishing connection for version:', appVersionId);

    await fetchEventSource(`${config.apiUrl}/app-history-sse/apps/versions/${appVersionId}/stream`, {
      method: 'GET',
      headers: authHeader(),
      credentials: 'include',
      signal: controller.signal,
      onopen: async (response) => {
        console.log('[SSE] Connection opened, status:', response.status);
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
          console.log('[SSE] SSE connection established successfully');
          if (onOpen) onOpen(response);
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          console.error('[SSE] Client error:', response.status);
          throw new Error(`SSE connection failed with status ${response.status}`);
        }
      },
      onmessage: (event) => {
        console.log('[SSE] Message received:', event);
        if (onMessage) onMessage(event);
      },
      onerror: (error) => {
        console.error('[SSE] Error occurred:', error);
        if (onError) {
          onError(error);
        }
        // Don't throw error to prevent automatic retry
        // The library will handle retries automatically
      },
      onclose: () => {
        console.log('[SSE] Connection closed');
        if (onClose) onClose();
      },
    });
  } catch (error) {
    console.error('[SSE] Failed to establish connection:', error);
    if (onError) onError(error);
  }

  return controller;
}
