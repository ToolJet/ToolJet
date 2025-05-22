import config from 'config';
import { authHeader, handleResponse, handleResponseWithoutValidation } from '@/_helpers';
import queryString from 'query-string';

export const organizationService = {
  getUsersByValue,
  createOrganization,
  editOrganization,
  getOrganizations,
  switchOrganization,
  getSSODetails,
  editOrganizationConfigs,
  getWorkspacesLimit,
  checkWorkspaceUniqueness,
  updateOrganization,
  setDefaultWorkspace,
};

function getUsersByValue(searchInput) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization-users/users/suggest?input=${searchInput}`, requestOptions).then(
    handleResponse
  );
}

function createOrganization(data) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(data),
  };
  return fetch(`${config.apiUrl}/organizations`, requestOptions).then(handleResponse);
}

// Used for making API calls to update workspace name/slug and workspace status
function updateOrganization(params, organizationId = '') {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(params),
  };
  return fetch(`${config.apiUrl}/organizations${organizationId ? `/${organizationId}` : ''}`, requestOptions).then(
    handleResponse
  );
}

//  Used for making API calls to update details related to organization's SSO configurations
function editOrganization(params, organizationId = '') {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(params),
  };
  return fetch(
    `${config.apiUrl}/login-configs/organization-general${organizationId ? `/${organizationId}` : ''}`,
    requestOptions
  ).then(handleResponse);
}

function getOrganizations(status = 'active', currentPage = undefined, perPageCount = undefined, name = undefined) {
  const query = queryString.stringify({
    status,
    currentPage,
    perPageCount,
    name,
  });
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organizations?${query}`, requestOptions).then(handleResponse);
}

function switchOrganization(organizationId) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/switch/${organizationId}`, requestOptions).then(handleResponseWithoutValidation);
}

function getSSODetails() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/login-configs/organization`, requestOptions).then(handleResponse);
}

function editOrganizationConfigs(params) {
  const requestOptions = {
    method: 'PATCH',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(params),
  };
  return fetch(`${config.apiUrl}/login-configs/organization-sso`, requestOptions).then(handleResponse);
}

function getWorkspacesLimit() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/organizations/limits`, requestOptions).then(handleResponse);
}

function checkWorkspaceUniqueness(name, slug) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = queryString.stringify({ name, slug });
  return fetch(`${config.apiUrl}/organizations/is-unique?${query}`, requestOptions).then(handleResponse);
}

function setDefaultWorkspace(workspaceId) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organizations/${workspaceId}/default`, requestOptions).then(handleResponse);
}
