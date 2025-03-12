import config from 'config';
import { handleResponse, authHeader } from '@/_helpers';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { setupFirstUser, verifyToken, onboarding, checkWorkspaceNameUniqueness } from './onboarding.service.ce';
import { getCountryByTimeZone } from '@/modules/common/helpers/timeUtils';

// Re-export CE functions
export { setupFirstUser, verifyToken, onboarding, checkWorkspaceNameUniqueness };

// EE-specific functions
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
  return fetch(`${config.apiUrl}/onboarding/setup-super-admin`, requestOptions)
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
  return fetch(`${config.apiUrl}/onboarding/request-trial`, requestOptions)
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

const onSuperAdminAccountSetupSuccess = (userResponse) => {
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
  return fetch(`${config.apiUrl}/onboarding/session`, requestOptions)
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
  return fetch(`${config.apiUrl}/onboarding/trial-declined`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function finishOnboarding() {
  const requestOptions = {
    method: 'POST',
    credentials: 'include',
    headers: authHeader(),
    body: JSON.stringify({ region: getCountryByTimeZone() }),
  };
  return fetch(`${config.apiUrl}/onboarding/finish`, requestOptions).then(handleResponse);
}
function getSignupOnboardingSession() {
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(`${config.apiUrl}/onboarding/signup-session`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      updateCurrentSession({
        current_user: {
          ...response.adminDetails,
          id: response.userId,
        },
        current_organization_id: response.currentOrganizationId,
        current_organization_slug: response.currentOrganizationSlug,
      });
      return response;
    });
}
export {
  setupSuperAdmin,
  requestTrial,
  createOnboardSampleApp,
  getLicensePlans,
  getOnboardingSession,
  trialDeclined,
  finishOnboarding,
  getSignupOnboardingSession,
};
