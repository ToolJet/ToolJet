import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const orgEnvironmentConstantService = {
  getAll,
};

function getAll() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-constants`, requestOptions).then(handleResponse);
}
