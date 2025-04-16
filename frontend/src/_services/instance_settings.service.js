import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { appService } from './app.service';

export const instanceSettingsService = {
  fetchSettings,
  fetchSMTPSettings,
  update,
  updateSMTPSettings,
  fetchSSOConfigs,
  updateSSOConfigs,
  updateGeneralConfigs,
  updateSmtpEnvSetting,
  updateSmtpStatus,
};

function fetchSettings(type = 'user') {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/instance-settings`, requestOptions).then(handleResponse);
}

function fetchSMTPSettings(base = false) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/smtp?base=${base}`, requestOptions).then(handleResponse);
}

function updateSMTPSettings(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  return fetch(`${config.apiUrl}/smtp`, requestOptions).then(handleResponse);
}

async function updateSmtpEnvSetting(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  return fetch(`${config.apiUrl}/smtp/env`, requestOptions).then(handleResponse);
}

async function updateSmtpStatus(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  return fetch(`${config.apiUrl}/smtp/status`, requestOptions).then(handleResponse);
}

function fetchSSOConfigs() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/login-configs/instance-sso`, requestOptions).then(handleResponse);
}

async function updateGeneralConfigs(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(settings),
    credentials: 'include',
  };
  const response = await fetch(`${config.apiUrl}/login-configs/instance-general`, requestOptions);
  //update global instance settings of application
  await appService.getConfig().then((config) => {
    window.public_config = config;
  });
  const updatedConfigs = await handleResponse(response);
  return updatedConfigs;
}

function updateSSOConfigs(settings) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(settings),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/login-configs/instance-sso`, requestOptions).then(handleResponse);
}
async function update(settings) {
  const body = { settings: [...settings] };

  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };

  const response = await fetch(`${config.apiUrl}/instance-settings`, requestOptions);
  //update global instance settings of application
  await appService.getConfig().then((config) => {
    window.public_config = config;
  });
  const updatedSettings = await handleResponse(response);
  return updatedSettings;
}
