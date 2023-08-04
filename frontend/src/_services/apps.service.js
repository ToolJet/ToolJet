import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appsService = {
  validatePrivateApp,
  validateReleasedApp,
};

function validateReleasedApp(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/validate-released-app-access/${slug}`, requestOptions).then(handleResponse);
}

function validatePrivateApp(slug, accessType) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(
    `${config.apiUrl}/apps/validate-private-app-access/${slug}${accessType ? `?access_type=${accessType}` : ''}`,
    requestOptions
  ).then(handleResponse);
}
