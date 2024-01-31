import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const organizationUserService = {
  archiveAll,
  archive,
  unarchive,
  create,
  changeRole,
  inviteBulkUsers,
};

function create(first_name, last_name, email, groupIds = []) {
  const body = {
    first_name,
    last_name,
    email,
    groups: groupIds,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization_users`, requestOptions).then(handleResponse);
}

function inviteBulkUsers(formData) {
  const requestOptions = { method: 'POST', headers: authHeader(true), body: formData, credentials: 'include' };
  return fetch(`${config.apiUrl}/organization_users/upload_csv`, requestOptions).then(handleResponse);
}

// Deprecated
function changeRole(id, role) {
  const body = {
    role,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization_users/${id}/change_role`, requestOptions).then(handleResponse);
}

function archiveAll(userId) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization_users/${userId}/archive-all`, requestOptions).then(handleResponse);
}

function archive(id, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...(organizationId && { organizationId }) }),
  };
  return fetch(`${config.apiUrl}/organization_users/${id}/archive`, requestOptions).then(handleResponse);
}

function unarchive(id, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...(organizationId && { organizationId }) }),
  };
  return fetch(`${config.apiUrl}/organization_users/${id}/unarchive`, requestOptions).then(handleResponse);
}
