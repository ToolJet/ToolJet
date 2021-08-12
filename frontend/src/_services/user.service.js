import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const userService = {
  getAll,
  createUser,
  deleteUser,
  setPasswordFromToken,
  updateCurrentUser,
  changePassword,
};

function getAll() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function createUser(first_name, last_name, email, role) {
  const body = {
    first_name,
    last_name,
    email,
    role
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/users`, requestOptions).then(handleResponse);
}

function deleteUser(id) {
  const requestOptions = { method: 'DELETE', headers: authHeader(), body: JSON.stringify({}) };
  return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(handleResponse);
}

function setPasswordFromToken({ token, password, organization, newSignup, firstName, lastName }) {
  const body = {
    token,
    password,
    organization,
    new_signup: newSignup,
    first_name: firstName,
    last_name: lastName
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/users/set_password_from_token`, requestOptions).then(handleResponse);
}

function updateCurrentUser(firstName , lastName) {
  const body = { firstName, lastName };
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/users/update`, requestOptions).then(handleResponse);
}

function changePassword(currentPassword, newPassword) {
  const body = { currentPassword, newPassword };
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/users/change_password`, requestOptions).then(handleResponse);
}
