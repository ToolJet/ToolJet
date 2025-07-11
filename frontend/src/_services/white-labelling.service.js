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
  const orgId = headers['tj-workspace-id'];
  if (edition === 'cloud') {
    return fetch(`${config.apiUrl}/white-labelling/${organizationId || orgId}`, requestOptions).then(
      handleResponseWithoutValidation
    );
  }
  // For CE AND EE, make API call without organization ID parameter
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
