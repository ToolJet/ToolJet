import config from 'config';
import { authHeader, handleResponse, handleResponseWithoutValidation } from '@/_helpers';

function save(body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/custom-styles/`, requestOptions).then(handleResponse);
}

function get(validateResponse = true) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const handleOutput = validateResponse ? handleResponse : handleResponseWithoutValidation;
  return fetch(`${config.apiUrl}/custom-styles/`, requestOptions).then(handleOutput);
}

function getForPublicApp(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-styles/${slug}`, requestOptions).then(handleResponseWithoutValidation);
}

export const customStylesService = {
  save,
  get,
  getForPublicApp,
};
