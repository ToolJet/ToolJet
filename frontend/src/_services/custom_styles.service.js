import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

function save(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/custom-styles/`, requestOptions).then(handleResponse);
}

function get() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-styles/`, requestOptions).then(handleResponse);
}

function getForPublicApp(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-styles/${slug}`, requestOptions).then(handleResponse);
}

export const customStylesService = {
  save,
  get,
  getForPublicApp,
};
