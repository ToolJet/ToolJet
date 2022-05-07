import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const organizationService = {
  getUsers,
  createOrganization,
  editOrganization,
  getOrganizations,
  switchOrganization,
  getSSODetails,
  editOrganizationConfigs,
};

function getUsers() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/organizations/users`, requestOptions).then(handleResponse);
}

function createOrganization(name) {
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify({ name }) };
  return fetch(`${config.apiUrl}/organizations`, requestOptions).then(handleResponse);
}

function editOrganization(params) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(params) };
  return fetch(`${config.apiUrl}/organizations/`, requestOptions).then(handleResponse);
}

function getOrganizations() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/organizations`, requestOptions).then(handleResponse);
}

function switchOrganization(organizationId) {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/switch/${organizationId}`, requestOptions);
}

function getSSODetails() {
  const requestOptions = { method: 'GET', headers: authHeader() };
  return fetch(`${config.apiUrl}/organizations/configs`, requestOptions).then(handleResponse);
}

function editOrganizationConfigs(params) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(params) };
  return fetch(`${config.apiUrl}/organizations/configs`, requestOptions).then(handleResponse);
}
