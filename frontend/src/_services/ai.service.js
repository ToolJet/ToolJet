import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const aiService = {
  sendMessage,
  voteMessage,
  getCopilotSuggestion,
  getCreditBalance,
  fixWithAI,
  updateKey,
  getKeySettings,
  updateMessageData,
  listConversations,
  createConversation,
  getConversation,
  autoSort,
  getTokenUsage,
};

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

async function sendMessage(body, onMessage, isDocs = false) {
  const fullResponse = [];
  const url = isDocs ? `${config.apiUrl}/ai/conversation/docs-message` : `${config.apiUrl}/ai/conversation/message`;
  await fetchEventSource(url, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
    retryStrategy: {
      next: () => null,
    },
    openWhenHidden: true,
    onopen: async (response) => {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const err = new Error(data?.message || `HTTP error! status: ${response.status}`);
        err.statusCode = response.status;
        throw err;
      }
    },
    onmessage: (event) => {
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
      throw new Error(error);
    },
    onclose: () => {
      console.log('Connection closed');
    },
  });

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
