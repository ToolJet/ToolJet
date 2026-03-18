import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

function createTransferToken(targetOrganizationId) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    credentials: 'include',
    ...(targetOrganizationId && { body: JSON.stringify({ targetOrganizationId }) }),
  };
  return fetch(`${config.apiUrl}/session/transfer-token`, requestOptions).then(handleResponse);
}

export const sessionTransferService = {
  createTransferToken,
};
