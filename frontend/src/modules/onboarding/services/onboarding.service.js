import config from 'config';
import { handleResponse, authHeader } from '@/_helpers';
import { authorizeUserAndHandleErrors, updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import queryString from 'query-string';

function setupSuperAdmin({ companyName, buildPurpose, name, workspaceName, password, email }) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      companyName,
      buildPurpose,
      name,
      workspaceName,
      email,
      password,
    }),
  };
  return fetch(`${config.apiUrl}/setup-admin`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      onSuperAdminAccountSetupSuccess(response);
      return response;
    });
}

function requestTrial() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/request-trial`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function createOnboardSampleApp() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/library_apps/sample-onboard-app`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

const onSuperAdminAccountSetupSuccess = (userResponse, callBack) => {
  const { current_organization_id, current_organization_slug } = userResponse;
  /* reset the authentication status and loggingIn status */
  const { email, id, first_name, last_name, organization_id, organization, ...restResponse } = userResponse;
  const current_user = {
    email,
    id,
    first_name,
    last_name,
    organization_id,
    organization,
  };

  updateCurrentSession({
    current_user,
    ...restResponse,
  });
};

function onboarding({ companyName, buildPurpose, workspaceName, token, organizationToken, source }) {
  const payload = {
    ...(companyName && { companyName }),
    ...(buildPurpose && { buildPurpose }),
    ...(token && { token }),
    ...(organizationToken && { organizationToken }),
    ...(source && { source }),
    ...(workspaceName && { workspaceName }),
  };

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...payload,
    }),
  };
  return fetch(`${config.apiUrl}/setup-account-from-token`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      onSuperAdminAccountSetupSuccess(response);
      return response;
    });
}

function verifyToken(token, organizationToken) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(
    `${config.apiUrl}/verify-invite-token?token=${token}${
      organizationToken ? `&organizationToken=${organizationToken}` : ''
    }`,
    requestOptions
  )
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function getLicensePlans() {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(`${config.apiUrl}/license/plans`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function getOnboardingSession() {
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(`${config.apiUrl}/onboarding-session`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      updateCurrentSession({
        current_organization_id: response.currentOrganizationId,
        current_organization_slug: response.currentOrganizationSlug,
      });
      return response;
    });
}

function trialDeclined() {
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
    headers: authHeader(),
  };
  return fetch(`${config.apiUrl}/trial-declined`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function checkWorkspaceNameUniqueness(name) {
  const requestOptions = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
  const query = queryString.stringify({ name });
  return fetch(`${config.apiUrl}/organizations/workspace-name/unique?${query}`, requestOptions).then(handleResponse);
}

function finishOnboarding(params) {
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
    headers: authHeader(),
  };
  return fetch(`${config.apiUrl}/finish-onboarding`, requestOptions).then(handleResponse);
}

export {
  setupSuperAdmin,
  requestTrial,
  createOnboardSampleApp,
  verifyToken,
  onboarding,
  getLicensePlans,
  getOnboardingSession,
  trialDeclined,
  checkWorkspaceNameUniqueness,
  finishOnboarding,
};
