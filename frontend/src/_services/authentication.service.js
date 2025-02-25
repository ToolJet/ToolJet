import { BehaviorSubject } from 'rxjs';
import {
  handleResponse,
  setCookie,
  getCookie,
  eraseCookie,
  handleResponseWithoutValidation,
  authHeader,
} from '@/_helpers';
import { getWorkspaceId } from '@/_helpers/utils';
import config from 'config';
import queryString from 'query-string';
import { getRedirectTo, getRedirectToWithParams } from '@/_helpers/routes';

const currentSessionSubject = new BehaviorSubject({
  current_organization_id: null,
  current_organization_name: null,
  super_admin: null,
  admin: null,
  user_permissions: null,
  group_permissions: null,
  app_group_permissions: null,
  data_source_group_permissions: null,
  role: null,
  organizations: [],
  isUserLoggingIn: false,
  authentication_status: null,
  authentication_failed: null,
  isOrgSwitchingFailed: null,
  isUserUpdated: false,
  load_app: false, //key is used only in the viewer mode
  instance_id: null,
  noWorkspaceAttachedInTheSession: false,
  triggeredOnce: null,
  createdAt: null,
});

export const authenticationService = {
  login,
  superAdminLogin,
  signup,
  verifyToken,
  verifyOrganizationToken,
  setupAdmin,
  currentSession: currentSessionSubject.asObservable(),
  get currentSessionValue() {
    return currentSessionSubject.value;
  },
  updateCurrentSession(data) {
    currentSessionSubject.next(data);
  },
  signInViaOAuth,
  resetPassword,
  saveLoginOrganizationId,
  getLoginOrganizationId,
  deleteLoginOrganizationId,
  forgotPassword,
  resendInvite,
  authorize,
  getUserDetails,
  activateTrial,
  getLoginOrganizationSlug,
  saveLoginOrganizationSlug,
  getInvitedUserSession,
  activateAccountWithToken,
  getSignupOrganizationId,
  getSignupOrganizationSlug,
  getInviteFlowIndetifier,
  setSignUpOrganizationDetails,
  deleteAllAuthCookies,
};

function setSignUpOrganizationDetails(organizationId, organizationSlug, inviteFlowIdentifier) {
  organizationId && setCookie('signup-workspace-id', organizationId);
  organizationSlug && setCookie('signup-workspace-slug', organizationSlug);
  inviteFlowIdentifier && setCookie('invite-flow-identifier', inviteFlowIdentifier);
}

function deleteAllAuthCookies() {
  const cookiesToDelete = [
    'login-workspace',
    'login-workspace-slug',
    'signup-workspace-id',
    'signup-workspace-slug',
    'invite-flow-identifier',
  ];

  cookiesToDelete.forEach((cookieName) => eraseCookie(cookieName));
}

function login(email, password, organizationId) {
  const redirectTo = getRedirectTo();
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ email, password, redirectTo }),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/authenticate${organizationId ? `/${organizationId}` : ''}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      return user;
    });
}

function superAdminLogin(email, password) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/authenticate/super-admin`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      authenticationService.updateCurrentSession(user);
      return user;
    });
}

function getUserDetails() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/profile`, requestOptions).then(handleResponse);
}

function saveLoginOrganizationId(organizationId) {
  organizationId && setCookie('login-workspace', organizationId);
}

function getLoginOrganizationId() {
  return getCookie('login-workspace');
}

function getSignupOrganizationId() {
  return getCookie('signup-workspace-id');
}

function deleteLoginOrganizationId() {
  eraseCookie('login-workspace');
}

function getSignupOrganizationSlug() {
  return getCookie('signup-workspace-slug');
}

function getInviteFlowIndetifier() {
  return getCookie('invite-flow-identifier');
}

function saveLoginOrganizationSlug(organizationSlug) {
  organizationSlug && setCookie('login-workspace-slug', organizationSlug);
}

function getLoginOrganizationSlug() {
  return getCookie('login-workspace-slug');
}

function signup(email, name, password, organizationId, redirectTo) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password, organizationId, redirectTo }),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/onboarding/signup`, requestOptions).then(handleResponse);
}

function activateAccountWithToken(email, password, organizationToken) {
  const requestOptions = {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, organizationToken }),
  };

  return fetch(`${config.apiUrl}/onboarding/activate-account-with-token`, requestOptions).then(handleResponse);
}

function resendInvite(email, organizationId, redirectTo) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, organizationId, redirectTo }),
  };

  return fetch(`${config.apiUrl}/onboarding/resend-invite`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function setupAdmin({ companyName, companySize, name, role, workspace, password, email, phoneNumber, requestedTrial }) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      companyName,
      companySize,
      role,
      name,
      workspace,
      email,
      password,
      requestedTrial,
      ...(phoneNumber?.length > 0 && { phoneNumber: `+${phoneNumber}` }),
    }),
  };
  return fetch(`${config.apiUrl}/setup-admin`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function activateTrial() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/onboarding/activate-trial`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function verifyOrganizationToken(token) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(`${config.apiUrl}/onboarding/verify-organization-token?token=${token}`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function verifyToken(token, organizationToken) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  return fetch(
    `${config.apiUrl}/onboarding/verify-invite-token?token=${token}${
      organizationToken ? `&organizationToken=${organizationToken}` : ''
    }`,
    requestOptions
  )
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}

function forgotPassword(email) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  };

  return fetch(`${config.apiUrl}/forgot-password`, requestOptions).then(handleResponse);
}

function resetPassword(params) {
  const { token, password } = params;

  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  };

  return fetch(`${config.apiUrl}/reset-password`, requestOptions).then(handleResponse);
}

function signInViaOAuth(configId, ssoType, ssoResponse) {
  const organizationId = getLoginOrganizationId();
  const signupOrganizationId = getSignupOrganizationId();
  const invitationToken = getInviteFlowIndetifier();
  const redirectTo = getCookie('redirectPath');
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...ssoResponse, organizationId, signupOrganizationId, invitationToken, redirectTo }),
  };

  const url = configId ? configId : `common/${ssoType}`;

  return fetch(`${config.apiUrl}/oauth/sign-in/${url}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      if (!user.redirect_url) {
        authenticationService.updateCurrentSession(user);
      }
      return user;
    });
}

function authorize() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/authorize`, requestOptions).then(handleResponseWithoutValidation);
}

function getInvitedUserSession({ accountToken, organizationToken }) {
  const body = { organizationToken, ...(accountToken && { accountToken }) };
  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/session/invited-user-session`, requestOptions).then(handleResponseWithoutValidation);
}
