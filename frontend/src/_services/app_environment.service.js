import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import queryString from 'query-string';

export const appEnvironmentService = {
  getAllEnvironments,
  getVersionsByEnvironment,
};

function getAllEnvironments() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/app-environments`, requestOptions).then(handleResponse);
}

/* 
MERGE NOTES (EE/Cloud) !!!:
 * the endpoint will be changed to /:environmentId/versions
 * function will have environment as new params id
 (So don't miss the changes while resolving the conflicts. and don't remove this comment in future) 

 for CE don't need to pass the environmentId
*/
function getVersionsByEnvironment(appId, environmentId /* not needed for CE */) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  const query = queryString.stringify({ app_id: appId });

  return fetch(
    `${config.apiUrl}/app-environments${environmentId ? `/${environmentId}` : ''}/versions${query ? `?${query}` : ''}`,
    requestOptions
  ).then(handleResponse);
}
