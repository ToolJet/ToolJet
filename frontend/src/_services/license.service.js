import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

//cloud-licensing organization specific- don't change this file
export const licenseService = {
  get,
  update,
  getFeatureAccess,
  generateCloudTrial,
  getDomainsList,
  upgradePlan,
};

function get() {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/organization/${organizationId}`, requestOptions).then(handleResponse);
}

async function update(body) {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = { method: 'PATCH', headers: authHeader(), body: JSON.stringify(body), credentials: 'include' };
  const updatedData = await fetch(`${config.apiUrl}/license/organization/${organizationId}`, requestOptions).then(
    handleResponse
  );
  return updatedData;
}

function getFeatureAccess() {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/organization/${organizationId}/access`, requestOptions).then(handleResponse);
}

function getDomainsList() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/license/organization/domains`, requestOptions).then(handleResponse);
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
  return fetch(`${config.apiUrl}/license/organization/payment/redirect`, requestOptions).then(handleResponse);
}
