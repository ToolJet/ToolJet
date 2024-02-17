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
import { getRedirectToWithParams } from '@/_helpers/routes';

const currentSessionSubject = new BehaviorSubject({
  current_organization_id: null,
  current_organization_name: null,
  super_admin: null,
  admin: null,
  group_permissions: null,
  app_group_permissions: null,
  organizations: [],
  isUserLoggingIn: false,
  authentication_status: null,
  authentication_failed: null,
  isUserUpdated: false,
  load_app: false, //key is used only in the viewer mode
  noWorkspaceAttachedInTheSession: false,
});

export const authenticationService = {
  login,
  getOrganizationConfigs,
  logout,
  signup,
  verifyToken,
  verifyOrganizationToken,
  onboarding,
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
  validateSession,
  getUserDetails,
  getLoginOrganizationSlug,
  saveLoginOrganizationSlug,
  deleteLoginOrganizationSlug,
  getInvitedUserSession,
  activateAccountWithToken,
  setSignupOrganizationId,
  getSignupOrganizationId,
};

function login(email, password, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  };

  return fetch(`${config.apiUrl}/authenticate${organizationId ? `/${organizationId}` : ''}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      return user;
    });
}

function validateSession(appId, workspaceSlug) {
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
  };
  const query = queryString.stringify({ appId, workspaceSlug });
  return fetch(`${config.apiUrl}/session${query ? `?${query}` : ''}`, requestOptions).then(
    handleResponseWithoutValidation
  );
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

function setSignupOrganizationId(value) {
  return setCookie('signup-workspace', value);
}

function getSignupOrganizationId() {
  return getCookie('signup-workspace');
}

function deleteLoginOrganizationId() {
  eraseCookie('login-workspace');
}

function saveLoginOrganizationSlug(organizationSlug) {
  organizationSlug && setCookie('login-workspace-slug', organizationSlug);
}

function getLoginOrganizationSlug() {
  return getCookie('login-workspace-slug');
}

function deleteLoginOrganizationSlug() {
  eraseCookie('login-workspace-slug');
}

function getOrganizationConfigs(organizationId) {
  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  };

  return fetch(
    `${config.apiUrl}/organizations/${organizationId ? `${organizationId}/` : ''}public-configs`,
    requestOptions
  )
    .then(handleResponse)
    .then((configs) => configs?.sso_configs);
}

function signup(email, name, password, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password, organizationId }),
  };

  return fetch(`${config.apiUrl}/signup`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      return user;
    });
}

function activateAccountWithToken(email, name, password, organizationToken, source) {
  const requestOptions = {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password, organizationToken, source }),
  };

  return fetch(`${config.apiUrl}/activate-account-with-token`, requestOptions).then(handleResponse);
}

function resendInvite(email) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  };

  return fetch(`${config.apiUrl}/resend-invite`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function onboarding({ companyName, companySize, role, token, organizationToken, source, password, phoneNumber }) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...(companyName?.length > 0 && { companyName }),
      ...(companySize?.length > 0 && { companySize }),
      ...(role?.length > 0 && { role }),
      ...(token?.length > 0 && { token }),
      ...(organizationToken?.length > 0 && { organizationToken }),
      ...(source?.length > 0 && { source }),
      ...(password?.length > 0 && { password }),
      ...(phoneNumber?.length > 0 && { phoneNumber: `+${phoneNumber}` }),
    }),
  };

  return fetch(`${config.apiUrl}/setup-account-from-token`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function setupAdmin({ companyName, companySize, name, role, workspace, password, email, phoneNumber }) {
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
      ...(phoneNumber?.length > 0 && { phoneNumber: `+${phoneNumber}` }),
    }),
  };
  return fetch(`${config.apiUrl}/setup-admin`, requestOptions)
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
  return fetch(`${config.apiUrl}/verify-organization-token?token=${token}`, requestOptions)
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

function logout(avoidRedirection = false) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };

  const redirectToLoginPage = () => {
    const loginPath =
      (window.public_config?.SUB_PATH || '/') + 'login' + `${getWorkspaceId() ? `/${getWorkspaceId()}` : ''}`;
    if (avoidRedirection) {
      window.location.href = loginPath;
    } else {
      const pathname = getRedirectToWithParams(true);
      window.location.href = loginPath + `?redirectTo=${`${pathname.indexOf('/') === 0 ? '' : '/'}${pathname}`}`;
    }
  };

  return fetch(`${config.apiUrl}/logout`, requestOptions)
    .then(handleResponseWithoutValidation)
    .finally(() => redirectToLoginPage());
}

function signInViaOAuth(configId, ssoType, ssoResponse, signupOrganizationId) {
  const organizationId = getLoginOrganizationId();
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...ssoResponse, organizationId, signupOrganizationId }),
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
  return fetch(`${config.apiUrl}/invited-user-session`, requestOptions).then(handleResponseWithoutValidation);
}
