import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const aiService = {
  downloadAttachment,
  removeAttachment,
  sendMessage,
  voteMessage,
  getCopilotSuggestion,
  getCreditBalance,
  getCreditsUsage,
  getMyCredits,
  updateCreditLimits,
  updateBuilderLimit,
  fixWithAI,
  updateKey,
  getKeySettings,
  updateMessageData,
  listConversations,
  createConversation,
  getConversation,
  getConversationStatus,
  cancelGeneration,
  autoSort,
  getTokenUsage,
  getLlmPreference,
  updateLlmPreference,
  getOpenRouterModels,
  getProviderModels,
};

async function downloadAttachment(id, signal, thumbnail = false) {
  const response = await fetch(
    `${config.apiUrl}/ai/attachments/${encodeURIComponent(id)}/content${thumbnail ? '?thumbnail=1' : ''}`,
    {
      headers: authHeader(true),
      credentials: 'include',
      signal,
    }
  );
  if (!response.ok) throw new Error('Unable to load attachment');
  return response.blob();
}

function removeAttachment(id) {
  return fetch(`${config.apiUrl}/ai/attachments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeader(true),
    credentials: 'include',
  }).then(handleAITextResponse);
}

function handleAITextResponse(response) {
  return response.text().then((text) => {
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw {
        error: data?.message || text || response.statusText,
        data: data || { message: text },
        statusCode: response?.status,
      };
    }

    return data ?? text;
  });
}

async function voteMessage(messageId, voteType) {
  const body = {
    messageId,
    voteType,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/conversation/vote-message`, requestOptions).then(handleResponse);
}

// The server pushes a `heartbeat` SSE event every 5s, so a live stream always
// ticks well inside this window. If the connection is silently severed (proxy /
// network drop, backgrounded socket), fetchEventSource — configured with no retry
// — never fires onclose/onerror and the awaited promise below would hang forever,
// freezing the chat in a perpetual loading state. Aborting after this much total
// silence lets the caller settle and re-sync from the persisted conversation.
const AI_STREAM_STALL_TIMEOUT_MS = 30000;
const MAX_ATTACHMENT_STREAM_CHARS = 8 * 1024 * 1024;

// XHR exposes upload progress while preserving the streaming Response contract used by SSE.
// The upload deadline measures inactivity, so a slow connection can keep making progress.
export function attachmentStreamFetch(url, options, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let stream;
    let offset = 0;
    let opened = false;
    let finished = false;
    const abort = () => xhr.abort();
    const finish = (error) => {
      if (finished) return;
      finished = true;
      options.signal?.removeEventListener('abort', abort);
      if (error) {
        if (opened) stream.error(error);
        else reject(error);
      } else stream.close();
    };
    const flush = (final = false) => {
      if (!opened || finished) return;
      const text = xhr.responseText;
      // XHR retains its response buffer. Hand long builds to the existing status watcher
      // instead of retaining an unbounded second copy of all SSE updates in the browser.
      if (text.length > MAX_ATTACHMENT_STREAM_CHARS) {
        finish(new Error('Attachment response buffer limit reached; reconnecting to the build.'));
        xhr.abort();
        return;
      }
      let end = text.length;
      // Do not split a UTF-16 surrogate pair between browser progress events.
      if (!final && end > offset && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
      if (end > offset) stream.enqueue(new TextEncoder().encode(text.slice(offset, end)));
      offset = end;
    };
    xhr.open(options.method || 'GET', url);
    xhr.withCredentials = options.credentials === 'include';
    Object.entries(options.headers || {}).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    xhr.upload.onprogress = onProgress;
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 2 || opened || !xhr.status) return;
      opened = true;
      const headers = new Headers();
      xhr
        .getAllResponseHeaders()
        .trim()
        .split(/[\r\n]+/)
        .filter(Boolean)
        .forEach((line) => {
          const colon = line.indexOf(':');
          if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim());
        });
      const body = new ReadableStream({
        start(controller) {
          stream = controller;
        },
        cancel: abort,
      });
      resolve(
        new Response(body, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers,
        })
      );
    };
    xhr.onprogress = () => flush();
    xhr.onload = () => {
      flush(true);
      finish();
    };
    xhr.onerror = () => finish(new Error('Attachment connection lost. Please retry.'));
    xhr.onabort = () => finish(new DOMException('Request aborted', 'AbortError'));
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) return finish(new DOMException('Request aborted', 'AbortError'));
    xhr.send(options.body);
  });
}

async function sendMessage(body, onMessage, isDocs = false) {
  const fullResponse = [];
  const url = isDocs ? `${config.apiUrl}/ai/conversation/docs-message` : `${config.apiUrl}/ai/conversation/message`;
  const { attachments = [], ...payload } = body;
  const files = attachments.filter((file) => file instanceof File);
  const retained = attachments.filter((file) => !(file instanceof File));
  if (retained.length) payload.attachmentIds = retained.map((file) => file.id);
  let requestBody = JSON.stringify(payload);
  const headers = { ...authHeader() };
  if (files.length) {
    if (isDocs) throw new Error('Attachments are supported in builder chats.');
    const form = new FormData();
    form.append('payload', requestBody);
    files.forEach((file) => form.append('files', file));
    requestBody = form;
    // The browser supplies the multipart boundary.
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  let stalled = false;
  let stallTimer = null;
  const armStallTimer = (timeout = AI_STREAM_STALL_TIMEOUT_MS) => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      stalled = true;
      controller.abort();
    }, timeout);
  };

  try {
    armStallTimer(files.length ? 120000 : AI_STREAM_STALL_TIMEOUT_MS);
    await fetchEventSource(url, {
      method: 'POST',
      headers,
      body: requestBody,
      credentials: 'include',
      signal: controller.signal,
      ...(files.length
        ? {
            fetch: (input, options) => attachmentStreamFetch(input, options, () => armStallTimer(120000)),
          }
        : {}),
      retryStrategy: {
        next: () => null,
      },
      openWhenHidden: true,
      onopen: async (response) => {
        armStallTimer();
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const err = new Error(data?.message || `HTTP error! status: ${response.status}`);
          err.statusCode = response.status;
          throw err;
        }
      },
      onmessage: (event) => {
        // Any event, including the server heartbeat, proves the stream is alive.
        armStallTimer();
        if (!event.data) return;
        try {
          const parsed = JSON.parse(event.data);
          fullResponse.push(parsed);
          const { event: type } = event;
          onMessage({
            data: parsed,
            type,
          });
        } catch (e) {
          console.log(e);
        }
      },
      onerror: (error) => {
        console.log(error);
        throw error instanceof Error ? error : new Error(error);
      },
      onclose: () => {
        console.log('Connection closed');
      },
    });
    // fetch-event-source resolves when its signal is aborted, rather than rejecting.
    if (stalled) throw new Error('Stream stalled');
  } catch (error) {
    if (stalled) {
      const stallError = new Error('AI stream stalled — connection lost before completion');
      stallError.stalled = true;
      throw stallError;
    }
    throw error;
  } finally {
    if (stallTimer) clearTimeout(stallTimer);
  }

  return fullResponse;
}

async function getCopilotSuggestion(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/copilot`, requestOptions).then(handleAITextResponse);
}
async function getCreditBalance() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(`${config.apiUrl}/ai/get-credits-balance`, requestOptions).then((response) =>
    handleResponse(response, undefined, undefined, true)
  );
}

// Caller's own numbers; scope from the session.
async function getMyCredits() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/credits-usage/me`, requestOptions).then((response) =>
    handleResponse(response, undefined, undefined, true)
  );
}

async function getCreditsUsage() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/credits-usage`, requestOptions).then(handleResponse);
}

async function updateCreditLimits(body) {
  const requestOptions = { method: 'PUT', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/credits-usage/limits`, requestOptions).then(handleResponse);
}

async function updateBuilderLimit(userId, body) {
  const requestOptions = { method: 'PUT', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/credits-usage/limits/builders/${userId}`, requestOptions).then(handleResponse);
}

async function fixWithAI(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/fix-with-ai`, requestOptions).then(handleAITextResponse);
}

async function updateKey(body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/update-key`, requestOptions).then(handleResponse);
}

async function getKeySettings(licenseType) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/key-settings?licenseType=${licenseType}`, requestOptions).then(handleResponse);
}

async function updateMessageData(messageId, body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };

  return fetch(`${config.apiUrl}/ai/conversation/message/${messageId}`, requestOptions).then(handleResponse);
}

async function listConversations(appId, conversationType = 'generate') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    `${config.apiUrl}/ai/conversations?appId=${appId}&conversationType=${conversationType}`,
    requestOptions
  ).then(handleResponse);
}

async function createConversation(payload) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ...payload, ...(!payload?.conversationType && { conversationType: 'generate' }) }),
  };
  return fetch(`${config.apiUrl}/ai/conversation`, requestOptions).then(handleResponse);
}

async function getConversation(conversationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/conversation/${conversationId}`, requestOptions).then(handleResponse);
}

async function getConversationStatus(conversationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/conversation/${conversationId}/status`, requestOptions).then(handleResponse);
}

async function cancelGeneration(conversationId, runId) {
  return fetch(`${config.apiUrl}/ai/conversation/${conversationId}/runs/${runId}/cancel`, {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  }).then(handleResponse);
}

async function autoSort(body) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/ai/autosort`, requestOptions).then(handleAITextResponse);
}

async function getTokenUsage(conversationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/conversation/${conversationId}/token-usage`, requestOptions).then(handleResponse);
}

async function getOpenRouterModels() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/openrouter-models`, requestOptions).then(handleResponse);
}

async function getProviderModels(provider) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/provider-models?provider=${encodeURIComponent(provider)}`, requestOptions).then(
    handleResponse
  );
}

// `conversationId` selects which chat's provider/model is being read or written. Omitted on the
// home page, where no chat exists yet — there the call reads and writes the workspace default,
// which is what the next new chat will be created with.
async function getLlmPreference(conversationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : '';
  return fetch(`${config.apiUrl}/ai/llm-preference${query}`, requestOptions).then(handleResponse);
}

async function updateLlmPreference(provider, model, modelContextWindow, conversationId) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({
      provider,
      ...(model ? { model, modelContextWindow } : {}),
      ...(conversationId ? { conversationId } : {}),
    }),
  };
  return fetch(`${config.apiUrl}/ai/llm-preference`, requestOptions).then(handleResponse);
}
