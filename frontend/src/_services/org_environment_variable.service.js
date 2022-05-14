import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const orgEnvironmentVariableService = {
  create,
};

function create(variable_name, value, encrypted) {
  const body = {
    variable_name,
    value,
    encrypted,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/organization_variables`, requestOptions).then(handleResponse);
}
