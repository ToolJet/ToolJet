import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import queryString from 'query-string';

export const userService = {
  getInstanceUsers,
  getAll,
  createUser,
  deleteUser,
  updateCurrentUser,
  changePassword,
  getAvatar,
  updateAvatar,
  updateUserType,
  updateUserTypeInstance,
  getUserLimits,
  changeUserPassword,
  generateUserPassword,
};

function getInstanceUsers(page, options) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const { status, searchText } = options;
  const query = queryString.stringify({ page, status, searchText });

  return fetch(`${config.apiUrl}/users?${query}`, requestOptions).then(handleResponse);
}

function getAll() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function getAvatar(id) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/files/${id}`, requestOptions)
    .then((response) => response.blob())
    .then((blob) => blob);
}

function updateAvatar(formData) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(true),
    body: formData,
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/profile/avatar`, requestOptions).then(handleResponse);
}

function createUser(first_name, last_name, email, role) {
  const body = {
    first_name,
    last_name,
    email,
    role,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function deleteUser(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), credentials: 'include', body: JSON.stringify({}) };
  return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function updateCurrentUser(firstName, lastName) {
  const body = { first_name: firstName, last_name: lastName };
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/profile`, requestOptions).then(handleResponse);
}

function updateUserType(userUpdateBody) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(userUpdateBody),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/users/user-type`, requestOptions).then(handleResponse);
}

function updateUserTypeInstance(userUpdateBody) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    body: JSON.stringify(userUpdateBody),
    credentials: 'include',
  };
  console.log('usertypebody', userUpdateBody);
  return fetch(`${config.apiUrl}/users/user-type/instance`, requestOptions).then(handleResponse);
}

function changePassword(currentPassword, newPassword) {
  const body = { currentPassword, newPassword };
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/profile/password`, requestOptions).then(handleResponse);
}

function changeUserPassword(userId, newPassword) {
  const body = { newPassword };
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/users/${userId}/password`, requestOptions).then(handleResponse);
}

function generateUserPassword(userId) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/users/${userId}/password/generate`, requestOptions).then(handleResponse);
}

function getUserLimits(type) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/users/limits/${type}`, requestOptions).then(handleResponse);
}
