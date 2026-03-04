import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

function createTransferToken() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/session/transfer-token`, requestOptions).then(handleResponse);
}

export const sessionTransferService = {
  createTransferToken,
};
