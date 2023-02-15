import { BehaviorSubject } from 'rxjs';
import {
  handleResponse,
  setCookie,
  getCookie,
  eraseCookie,
  handleResponseWithoutValidation,
  authHeader,
} from '@/_helpers';
import config from 'config';

const currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('currentUser')));

const currentOrgSubject = new BehaviorSubject({
  current_organization_id: null,
  current_organization_name: null,
  super_admin: null,
  admin: null,
  group_permissions: null,
  app_group_permissions: null,
});

const currentOrgSubjectService = {
  update: function (org) {
    currentOrgSubject.next(org);
  },
};

export const authenticationService = {
  login,
  getOrganizationConfigs,
  logout,
  clearUser,
  signup,
  verifyToken,
  verifyOrganizationToken,
  updateCurrentUserDetails,
  onboarding,
  updateUser,
  setupAdmin,
  currentUser: currentUserSubject.asObservable(),
  currentOrganization: currentOrgSubject.asObservable(),
  get currentUserValue() {
    return currentUserSubject.value;
  },
  get currentOrgValue() {
    return currentOrgSubject.value;
  },
  updateCurrentOrg(orgData) {
    currentOrgSubjectService.update(orgData);
  },
  signInViaOAuth,
  resetPassword,
  saveLoginOrganizationId,
  getLoginOrganizationId,
  deleteLoginOrganizationId,
  forgotPassword,
  resendInvite,
  authorize,
};

function login(email, password, organizationId) {
  const requestOptions = {
    method: 'POST',
    headers: {
      ...(organizationId &&
        authenticationService.currentUserValue && {
          Authorization: `Bearer ${authenticationService.currentUserValue.auth_token}`,
        }),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  };

  return fetch(`${config.apiUrl}/authenticate${organizationId ? `/${organizationId}` : ''}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      // store user details and jwt token in local storage to keep user logged in between page refreshes
      updateUser(user);
      return user;
    });
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

function updateCurrentUserDetails(details) {
  const currentUserDetails = JSON.parse(localStorage.getItem('currentUser'));
  const updatedUserDetails = Object.assign({}, currentUserDetails, details);
  updateUser(updatedUserDetails);
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
function onboarding({ companyName, companySize, role, token, organizationToken, source, password }) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(companyName?.length > 0 && { companyName }),
      ...(companySize?.length > 0 && { companySize }),
      ...(role?.length > 0 && { role }),
      ...(token?.length > 0 && { token }),
      ...(organizationToken?.length > 0 && { organizationToken }),
      ...(source?.length > 0 && { source }),
      ...(password?.length > 0 && { password }),
    }),
  };

  return fetch(`${config.apiUrl}/setup-account-from-token`, requestOptions)
    .then(handleResponse)
    .then((response) => {
      return response;
    });
}
function setupAdmin({ companyName, companySize, name, role, workspace, password, email }) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName,
      companySize,
      role,
      name,
      workspace,
      email,
      password,
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

function logout() {
  clearUser();
  const loginPath = (window.public_config?.SUB_PATH || '/') + 'login';
  const pathname = window.public_config?.SUB_PATH
    ? window.location.pathname.replace(window.public_config?.SUB_PATH, '')
    : window.location.pathname;
  const redirectURL = excludeWorkspaceIdFromURL(pathname);
  window.location.href = loginPath + `?redirectTo=${!(redirectURL.indexOf('/') === 0) ? '/' : ''}${redirectURL}`;
}

const excludeWorkspaceIdFromURL = (pathname) => {
  const paths = pathname?.split('/').filter((path) => path !== '');
  paths.shift();
  return paths.join('/');
};

function clearUser() {
  // remove user from local storage to log user out
  localStorage.removeItem('currentUser');
  currentUserSubject.next(null);
}

function signInViaOAuth(configId, ssoType, ssoResponse) {
  const organizationId = getLoginOrganizationId();
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...ssoResponse, organizationId }),
  };

  const url = configId ? configId : `common/${ssoType}`;

  return fetch(`${config.apiUrl}/oauth/sign-in/${url}`, requestOptions)
    .then(handleResponseWithoutValidation)
    .then((user) => {
      if (!user.redirect_url) {
        updateUser(user);
      }
      return user;
    });
}

function updateUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  currentUserSubject.next(user);

  const { current_organization_id, current_organization_name } = user;
  let orgDetails = {
    current_organization_id,
    current_organization_name,
  };
  authenticationService.updateCurrentOrg(orgDetails);
}

function authorize() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
  };
  return fetch(`${config.apiUrl}/authorize`, requestOptions).then(handleResponse);
}
