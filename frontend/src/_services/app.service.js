import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appService = {
  getAll,
  createApp,
  getApp,
  saveApp,
  getAppUsers,
  createAppUser,
  setVisibility
};

function getAll(page) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps?page=${page}`, requestOptions).then(handleResponse);
}

function createApp() {
  const body = {
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/apps`, requestOptions).then(handleResponse);
}

function getApp(id) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function saveApp(id, attributes) {
  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify({ app: attributes }) };
  return fetch(`${config.apiUrl}/apps/${id}`, requestOptions).then(handleResponse);
}

function getAppUsers(id) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/apps/${id}/users`, requestOptions).then(handleResponse);
}

function createAppUser(app_id, org_user_id, role) {
  const body = {
    app_id,
    org_user_id,
    role
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/app_users`, requestOptions).then(handleResponse);
}

function setVisibility(appId, visibility) {
  const requestOptions = { method: 'PUT', headers: authHeader(), body: JSON.stringify({ app: { is_public: visibility } }) };
  return fetch(`${config.apiUrl}/apps/${appId}`, requestOptions).then(handleResponse);
}
