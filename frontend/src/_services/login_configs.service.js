import { handleResponse } from '@/_helpers';
import config from 'config';

export const loginConfigsService = {
  getOrganizationConfigs,
};

function getOrganizationConfigs(organizationId) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };

  return fetch(`${config.apiUrl}/login-configs/${organizationId ? `${organizationId}/` : ''}public`, requestOptions)
    .then(handleResponse)
    .then((configs) => configs?.sso_configs);
}
