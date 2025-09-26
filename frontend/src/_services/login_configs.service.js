import { handleResponse, authHeader } from '@/_helpers';
import config from 'config';
import { fetchWhiteLabelDetails } from '@white-label/whiteLabelling';

export const loginConfigsService = {
  getOrganizationConfigs,
};

function getOrganizationConfigs(organizationId) {
  fetchWhiteLabelDetails(organizationId);
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };

  const headers = authHeader();
  const orgId = headers['tj-workspace-id'];

  return fetch(
    `${config.apiUrl}/login-configs/${orgId || organizationId ? `${orgId || organizationId}/` : ''}public`,
    requestOptions
  )
    .then(handleResponse)
    .then((configs) => configs?.sso_configs);
}
