import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';
import { authenticationService } from '@/_services';

export const workflowExecutionsService = {
  create,
};

function create(appVersionId) {
  const currentUser = authenticationService.currentUserValue;
  const body = { appVersionId, userId: currentUser.id };
  const requestOptions = { method: 'POST', headers: authHeader(), body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/workflow_executions`, requestOptions).then(handleResponse);
}
