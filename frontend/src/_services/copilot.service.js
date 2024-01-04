import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const copilotService = {
  getCopilotRecommendations,
  validateCopilotAPIKey,
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

function validateCopilotAPIKey(key, organizationId) {
  const body = {
    secretKey: key,
    organizationId,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/copilot/api-key`, requestOptions).then(handleResponse);
}
