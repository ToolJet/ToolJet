import config from 'config';
import { authHeader, handleResponse, handleResponseWithoutValidation } from '@/_helpers';
import queryString from 'query-string';

export const organizationService = {
  getUsers,
  getUsersByValue,
  createOrganization,
  editOrganization,
  getOrganizations,
  switchOrganization,
  getSSODetails,
  editOrganizationConfigs,
};

function getUsers(page, options) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const { firstName, lastName, email, searchText, status } = options;
  const query = queryString.stringify({ page, firstName, lastName, email, status, searchText });

  return fetch(`${config.apiUrl}/organizations/users?${query}`, requestOptions).then(handleResponse);
}

function getUsersByValue(searchInput) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organizations/users/suggest?input=${searchInput}`, requestOptions).then(
    handleResponse
  );
}

function createOrganization(name) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ name }),
  };
  return fetch(`${config.apiUrl}/organizations`, requestOptions).then(handleResponse);
}

function editOrganization(params) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(params),
  };
  return fetch(`${config.apiUrl}/organizations/`, requestOptions).then(handleResponse);
}

function getOrganizations() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organizations`, requestOptions).then(handleResponse);
}

function switchOrganization(organizationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/switch/${organizationId}`, requestOptions).then(handleResponseWithoutValidation);
}

function getSSODetails() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organizations/configs`, requestOptions).then(handleResponse);
}

function editOrganizationConfigs(params) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(params),
  };
  return fetch(`${config.apiUrl}/organizations/configs`, requestOptions).then(handleResponse);
}
