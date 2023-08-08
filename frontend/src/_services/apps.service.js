import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import queryString from 'query-string';

export const appsService = {
  validatePrivateApp,
  validateReleasedApp,
};

function validateReleasedApp(slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/apps/validate-released-app-access/${slug}`, requestOptions).then(handleResponse);
}

function validatePrivateApp(slug, access_type, version_name) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = queryString.stringify({ access_type, version_name });

  return fetch(
    `${config.apiUrl}/apps/validate-private-app-access/${slug}${query ? `?${query}` : ''}`,
    requestOptions
  ).then(handleResponse);
}
