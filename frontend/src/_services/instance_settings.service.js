import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const instanceSettingsService = {
  fetchSettings,
  update,
};

function fetchSettings() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/instance-settings`, requestOptions).then(handleResponse);
}

function update(settings) {
  const body = {
    ...settings,
  };

  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/instance-settings`, requestOptions).then(handleResponse);
}
