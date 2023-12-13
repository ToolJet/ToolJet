import config from 'config';
import { authHeader, handleResponseWithoutValidation } from '@/_helpers';

export const whiteLabellingService = {
  get,
  update,
};

function get() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/white-labelling`, requestOptions).then(handleResponseWithoutValidation);
}

function update(settings) {
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  return fetch(`${config.apiUrl}/white-labelling`, requestOptions).then(handleResponseWithoutValidation);
}
