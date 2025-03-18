import { handleResponseWithoutValidation, authHeader } from '@/_helpers';
import config from 'config';
import queryString from 'query-string';
import { getWorkspaceId } from '@/_helpers/utils';
import { getRedirectToWithParams } from '@/_helpers/routes';

export const sessionService = {
  validateSession,
  logout,
};

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

function logout(avoidRedirection = false, organizationId = null) {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  const workspaceId = getWorkspaceId() || organizationId;

  const redirectToLoginPage = () => {
    const loginPath = (window.public_config?.SUB_PATH || '/') + 'login' + `${workspaceId ? `/${workspaceId}` : ''}`;
    if (avoidRedirection) {
      window.location.href = loginPath;
    } else {
      const pathname = getRedirectToWithParams(true);
      window.location.href = loginPath + `?redirectTo=${`${pathname.indexOf('/') === 0 ? '' : '/'}${pathname}`}`;
    }
  };

  return fetch(`${config.apiUrl}/session/logout`, requestOptions)
    .then(handleResponseWithoutValidation)
    .finally(() => redirectToLoginPage());
}
