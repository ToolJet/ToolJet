import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const organizationUserService = {
  archive,
  create,
  changeRole,
};

function create(first_name, last_name, email, role) {
  const body = {
    first_name,
    last_name,
    email,
    role,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/organization_users`, requestOptions).then(handleResponse);
}

function changeRole(id, role) {
  const body = {
    role,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/organization_users/${id}/change_role`, requestOptions).then(handleResponse);
}

function archive(id) {
  const requestOptions = { method: 'POST', headers: authHeader() };
  return fetch(`${config.apiUrl}/organization_users/${id}/archive`, requestOptions).then(handleResponse);
}
