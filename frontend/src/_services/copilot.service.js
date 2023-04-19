import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const copilotService = {
  getCopilotRecommendations,
  getCopilotApiKey,
  saveCopilotApiKey,
};

async function getCopilotRecommendations(options) {
  const body = {
    query: options.query,
    context: options.context,
    language: options.lang,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };

  const { data } = await fetch(`${config.apiUrl}/copilot`, requestOptions).then(handleResponse);

  return data || {};
}

function getCopilotApiKey() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/copilot/api-key`, requestOptions).then(handleResponse);
}

function saveCopilotApiKey(apiKey) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ key: apiKey }),
  };
  return fetch(`${config.apiUrl}/copilot/api-key`, requestOptions).then(handleResponse);
}
