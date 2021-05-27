import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const sampleService = {
  deploy,
};

function deploy(identifier) {
  const body = {
    identifier
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/sample/`, requestOptions).then(handleResponse);
}
