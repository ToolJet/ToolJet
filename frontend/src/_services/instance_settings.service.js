import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const instanceSettingsService = {
  fetchSettings,
  update,
};

function fetchSettings(type = 'user') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const searchParams = `type=${type}`;
  return fetch(`${config.apiUrl}/instance-settings?${searchParams}`, requestOptions).then(handleResponse);
}

function update(settings) {
  const body = [...settings];

  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  return fetch(`${config.apiUrl}/instance-settings`, requestOptions).then(handleResponse);
}
