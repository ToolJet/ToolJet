import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const libraryAppService = {
  deploy,
  templateManifests,
};

function deploy(identifier) {
  const body = {
    identifier,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/library_apps/`, requestOptions).then(handleResponse);
}

function templateManifests() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/library_apps/`, requestOptions).then(handleResponse);
}
