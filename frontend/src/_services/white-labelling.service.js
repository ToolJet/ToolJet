import config from 'config';
import { authHeader, handleResponseWithoutValidation } from '@/_helpers';
import { fetchEdition } from '@/modules/common/helpers/utils';

export const whiteLabellingService = {
  get,
  update,
};

function get(organizationId = null) {
  const headers = authHeader();
  const requestOptions = {
    method: 'GET',
    headers: headers,
    credentials: 'include',
  };
  const edition = fetchEdition();
  const currentOrganizationId = headers['tj-workspace-id'] || organizationId;
  // Cloud edition with organization ID uses organization-specific endpoint
  if (edition === 'cloud' && currentOrganizationId) {
    return fetch(`${config.apiUrl}/white-labelling/${currentOrganizationId}`, requestOptions).then(
      handleResponseWithoutValidation
    );
  }
  // For CE, EE, and Cloud without organization ID, use generic endpoint without organizationID
  return fetch(`${config.apiUrl}/white-labelling`, requestOptions).then(handleResponseWithoutValidation);
}

function update(settings) {
  const headers = authHeader();
  const requestOptions = {
    method: 'PUT',
    headers: headers,
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  const organizationId = headers['tj-workspace-id'];
  const edition = fetchEdition();
  if (edition === 'cloud') {
    return fetch(`${config.apiUrl}/white-labelling/${organizationId}`, requestOptions).then(
      handleResponseWithoutValidation
    );
  }
  return fetch(`${config.apiUrl}/white-labelling`, requestOptions).then(handleResponseWithoutValidation);
}
