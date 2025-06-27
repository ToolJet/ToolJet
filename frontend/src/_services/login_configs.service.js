import { handleResponse } from '@/_helpers';
import config from 'config';
import { authHeader } from '@/_helpers';

export const loginConfigsService = {
  getOrganizationConfigs,
};

function getOrganizationConfigs(organizationId) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };

  const headers = authHeader();
  const orgId = headers['tj-workspace-id'];

  return fetch(`${config.apiUrl}/login-configs/${orgId ? `${orgId}/` : ''}public`, requestOptions)
    .then(handleResponse)
    .then((configs) => configs?.sso_configs);
}
