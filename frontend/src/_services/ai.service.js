import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const aiService = {
  generateApp,
  createComponent,
  createQuery,
  updateComponent,
  createEvent,
  updateEvent,
  updateQuery,
  fetchZeroState,
  enrichPrompt,
  agentic,
  createConversation,
  getConversation,
  sendMessage,
  voteMessage,
  regenerateResponse,
  approvePrd,
  getCopilotSuggestion,
  getCreditBalance,
};

function enrichPrompt(prompt) {
  const body = {
    prompt,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };

  return fetch(`${config.apiUrl}/agents/prompt-enrichment`, requestOptions).then(handleResponse);
}

function agentic(prompt) {
  const body = {
    prompt,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };

  return fetch(`${config.apiUrl}/agents/agentic`, requestOptions).then(handleResponse);
}

function generateApp(prompt) {
  const body = {
    prompt,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };

  return fetch(`${config.apiUrl}/ai/generateApp`, requestOptions).then(handleResponse);
}

function createComponent(prompt) {
  const body = {
    prompt,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/agents/create-components`, requestOptions).then(handleResponse);
}

function createQuery(prompt) {
  const body = {
    prompt,
    dataSource: null,
    columns: null,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/agents/create-query`, requestOptions).then(handleResponse);
}

async function updateComponent(prompt, pageId) {
  const body = {
    prompt,
    pageId,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/agents/update-components`, requestOptions).then(handleResponse);
}

async function createEvent(prompt, pageId) {
  const body = {
    prompt,
    pageId,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/agents/create-events`, requestOptions).then(handleResponse);
}

async function updateEvent(prompt, app_version_id) {
  const body = {
    prompt,
    app_version_id,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/agents/update-events`, requestOptions).then(handleResponse);
}

async function updateQuery(prompt) {
  const body = {
    prompt,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/agents/update-query`, requestOptions).then(handleResponse);
}

async function fetchZeroState() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/zeroState`, requestOptions).then(handleResponse);
}

async function createConversation() {
  const body = {
    prompt,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/conversation`, requestOptions).then(handleResponse);
}

async function getConversation(conversationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/ai/conversation/${conversationId}`, requestOptions).then(handleResponse);
}

async function voteMessage(messageId, voteType) {
  const body = {
    messageId,
    voteType,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/conversation/vote-message`, requestOptions).then(handleResponse);
}

async function regenerateResponse(parentMessageId) {
  const body = {
    parentMessageId,
  };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/conversation/regenerate-response`, requestOptions).then(handleResponse);
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
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

async function approvePrd(body, onMessage) {
  const fullResponse = [];

  await fetchEventSource(`${config.apiUrl}/ai/conversation/approve-prd`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
    retryStrategy: {
      next: () => null,
    },
    openWhenHidden: true,
    onopen: async (response) => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
  return fetch(`${config.apiUrl}/agents/copilot`, requestOptions).then(handleResponse);
}
async function getCreditBalance() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(`${config.apiUrl}/ai/get-credits-balance`, requestOptions).then(handleResponse);
}
