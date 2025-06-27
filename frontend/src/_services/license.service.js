import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const licenseService = {
  get,
  update,
  getFeatureAccess,
  generateCloudTrial,
  getDomainsList,
  upgradePlan,
  getUpcomingInvoice,
  updateInvoice,
  getCurrentPlan,
  getProration,
  updateSubscription,
  getPortalLink,
  updateOrganization,
};

function get() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse);
}

async function update(body) {
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  const updatedData = await fetch(`${config.apiUrl}/license`, requestOptions).then(handleResponse);
  return updatedData;
}

function getFeatureAccess() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/access`, requestOptions).then(handleResponse);
}

function getDomainsList() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/domains`, requestOptions).then(handleResponse);
}

function generateCloudTrial(createCloudTrialLicenseDto) {
  const headers = authHeader();
  const organizationId = createCloudTrialLicenseDto.organizationId;

  const requestOptions = {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createCloudTrialLicenseDto),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/license/organization/${organizationId}/trial`, requestOptions).then(handleResponse);
}

function upgradePlan(planDetails) {
  const headers = authHeader();

  const requestOptions = {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planDetails),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/organization/payment/redirect`, requestOptions).then(handleResponse);
}

function getUpcomingInvoice() {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization/payment/${organizationId}/invoice`, requestOptions).then(handleResponse);
}

function getCurrentPlan() {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/organization/payment/${organizationId}/plan`, requestOptions).then(handleResponse);
}

function getPortalLink(portalDto) {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(portalDto),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/organization/payment/${organizationId}/portal-link`, requestOptions).then(
    handleResponse
  );
}

function updateInvoice(id) {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/organization/payment/${organizationId}/invoice/${id}`, requestOptions).then(
    handleResponse
  );
}

function updateSubscription(updatedSubscription) {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(updatedSubscription),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/organization/payment/${organizationId}/subscription`, requestOptions).then(
    handleResponse
  );
}

function getProration(prorationData) {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(prorationData),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/organization/payment/${organizationId}/proration`, requestOptions).then(
    handleResponse
  );
}

async function updateOrganization(body) {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  const updatedData = await fetch(`${config.apiUrl}/license/organization/${organizationId}`, requestOptions).then(
    handleResponse
  );
  return updatedData;
}
