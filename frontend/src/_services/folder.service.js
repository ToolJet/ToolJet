import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const folderService = {
  create,
};


function create(name) {
  const body = {
    name
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/folders`, requestOptions).then(handleResponse);
}
