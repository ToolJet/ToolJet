import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appEnvironmentService = {
  getAllEnvironments,
};

function getAllEnvironments() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/app-environments`, requestOptions).then(handleResponse);
}
