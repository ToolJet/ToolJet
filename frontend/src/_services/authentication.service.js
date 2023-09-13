import { BehaviorSubject } from 'rxjs';
import {
  handleResponse,
  setCookie,
  getCookie,
  eraseCookie,
  handleResponseWithoutValidation,
  authHeader,
} from '@/_helpers';
import { excludeWorkspaceIdFromURL, getWorkspaceId } from '@/_helpers/utils';
import config from 'config';

const currentSessionSubject = new BehaviorSubject({
  current_organization_id: null,
  current_organization_name: null,
  super_admin: null,
  admin: null,
  group_permissions: null,
  app_group_permissions: null,
  data_source_group_permissions: null,
  organizations: [],
  authentication_status: null,
  authentication_failed: null,
  isUserUpdated: false,
  load_app: false, //key is used only in the viewer mode
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
      authenticationService.updateCurrentSession(user);
      return user;
    });
}

function validateSession(appId) {
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/session${appId ? `?appId=${appId}` : ''}`, requestOptions).then(
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

function deleteLoginOrganizationId() {
  eraseCookie('login-workspace');
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

function signup(email, name, password) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  };

  return fetch(`${config.apiUrl}/signup`, requestOptions)
    .then(handleResponse)
    .then((user) => {
      return user;
    });
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

  return fetch(`${config.apiUrl}/logout`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then(() => {
      const loginPath =
        (window.public_config?.SUB_PATH || '/') + 'login' + `${getWorkspaceId() ? `/${getWorkspaceId()}` : ''}`;
      if (avoidRedirection) {
        window.location.href = loginPath;
      } else {
        const pathname = window.public_config?.SUB_PATH
          ? window.location.pathname.replace(window.public_config?.SUB_PATH, '')
          : window.location.pathname;
        window.location.href =
          loginPath +
          `?redirectTo=${
            !['integrations', 'instance-settings'].find((subpath) => pathname.includes(subpath))
              ? excludeWorkspaceIdFromURL(pathname)
              : `${pathname.indexOf('/') === 0 ? '' : '/'}${pathname}`
          }`;
      }
    })
    .catch(() => {
      authenticationService.updateCurrentSession({
        authentication_status: false,
      });
    });
}

function signInViaOAuth(configId, ssoType, ssoResponse) {
  const organizationId = getLoginOrganizationId();
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify({ ...ssoResponse, organizationId }),
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
