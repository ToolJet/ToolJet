import config from 'config';
import { authHeader, handleResponseWithoutValidation } from '@/_helpers';

export const whiteLabellingService = {
  get,
  update,
};

function get(organizationId = null) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/white-labelling?organizationId=${organizationId}`, requestOptions).then(
    handleResponseWithoutValidation
  );
}

function update(settings) {
  const headers = authHeader();
  const requestOptions = {
    method: 'PUT',
    headers: headers,
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  const organizationId = headers['tj-workspace-id'];
  return fetch(`${config.apiUrl}/white-labelling/${organizationId}`, requestOptions).then(
    handleResponseWithoutValidation
  );
}
