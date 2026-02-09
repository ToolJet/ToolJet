import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export const aiService = {
  sendMessage,
  voteMessage,
  getCopilotSuggestion,
  getCreditBalance,
  fixWithAI,
  updateMessageData,
};

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
  return fetch(`${config.apiUrl}/ai/copilot`, requestOptions).then(handleResponse);
}
async function getCreditBalance() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };

  return fetch(`${config.apiUrl}/ai/get-credits-balance`, requestOptions).then((response) =>
    handleResponse(response, undefined, undefined, true)
  );
}

async function fixWithAI(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/ai/fix-with-ai`, requestOptions).then(handleResponse);
}

async function updateMessageData(messageId, body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };

  return fetch(`${config.apiUrl}/ai/conversation/message/${messageId}`, requestOptions).then(handleResponse);
}
