import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const appService = {
  getConfig,
  createAppUser,
  setPasswordFromToken,
  acceptInvite,
};

function getConfig() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/config`, requestOptions).then(handleResponse);
}

function createAppUser(app_id, org_user_id, role) {
  const body = {
    app_id,
    org_user_id,
    role,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/app_users`, requestOptions).then(handleResponse);
}

function setPasswordFromToken({ token, password, organization, role, firstName, lastName, organizationToken }) {
  const body = {
    token,
    organizationToken,
    password,
    organization,
    role,
    first_name: firstName,
    last_name: lastName,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/set-password-from-token`, requestOptions).then(handleResponse);
}

function acceptInvite({ token, password }) {
  const body = {
    token,
    password,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/accept-invite`, requestOptions);
}
