import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const organizationService = {
  getUsers,
};

function getUsers() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/organizations/users`, requestOptions).then(handleResponse);
}
