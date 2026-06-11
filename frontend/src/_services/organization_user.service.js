import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import queryString from 'query-string';

export const organizationUserService = {
  archiveAll,
  unarchiveAll,
  archive,
  unarchive,
  create,
  //changeRole,
  inviteBulkUsers,
  updateOrgUser,
  getUsers,
};

function create(id, body) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization-users`, requestOptions).then(handleResponse);
}

function inviteBulkUsers(formData) {
  const requestOptions = { method: 'POST', headers: authHeader(true), body: formData, credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-users/upload-csv`, requestOptions).then(handleResponse);
}

// Deprecated
// function changeRole(id, role) {
//   const body = {
//     role,
//   };

//   const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
//   return fetch(`${config.apiUrl}/organization-users/${id}/change-role`, requestOptions).then(handleResponse);
// }

function archiveAll(userId) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-users/${userId}/archive-all`, requestOptions).then(handleResponse);
}

function unarchiveAll(userId) {
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-users/${userId}/unarchive-all`, requestOptions).then(handleResponse);
}

function archive(id, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...(organizationId && { organizationId }) }),
  };
  return fetch(`${config.apiUrl}/organization-users/${id}/archive`, requestOptions).then(handleResponse);
}

function unarchive(id, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...(organizationId && { organizationId }) }),
  };
  return fetch(`${config.apiUrl}/organization-users/${id}/unarchive`, requestOptions).then(handleResponse);
}

function updateOrgUser(id, body) {
  const requestOptions = { method: 'PUT', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization-users/${id}`, requestOptions)
    .then(handleResponse)
    .then(() => {
      updateCurrentSession(body);
    });
}

function getUsers(page, options) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const { firstName, lastName, email, searchText, status } = options;
  const query = queryString.stringify({ page, firstName, lastName, email, status, searchText });

  return fetch(`${config.apiUrl}/organization-users?${query}`, requestOptions).then(handleResponse);
}
