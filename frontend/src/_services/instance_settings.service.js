import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { appService } from './app.service';

export const instanceSettingsService = {
  fetchSettings,
  update,
  fetchSSOConfigs,
  updateSSOConfigs,
  updateGeneralConfigs,
};

function fetchSettings(type = 'user') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const searchParams = `type=${type}`;
  return fetch(`${config.apiUrl}/instance-settings?${searchParams}`, requestOptions).then(handleResponse);
}

function fetchSSOConfigs() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/instance-login-configs/sso`, requestOptions).then(handleResponse);
}

async function updateGeneralConfigs(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(settings),
    credentials: 'include',
  };
  const updatedConfigs = await fetch(`${config.apiUrl}/instance-login-configs`, requestOptions).then(handleResponse);
  //update global instance settings of application
  appService.getConfig().then((config) => {
    window.public_config = config;
  });
  return updatedConfigs;
}

function updateSSOConfigs(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(settings),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/instance-login-configs/sso`, requestOptions).then(handleResponse);
}

async function update(settings) {
  const body = [...settings];

  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };

  const updatedSettings = await fetch(`${config.apiUrl}/instance-settings`, requestOptions).then(handleResponse);
  //update global instance settings of application
  appService.getConfig().then((config) => {
    window.public_config = config;
  });
  return updatedSettings;
}
