import { handleResponseWithoutValidation, authHeader } from '@/_helpers';
import config from 'config';
import queryString from 'query-string';
import { getWorkspaceId, stripTrailingSlash } from '@/_helpers/utils';
import { getRedirectToWithParams, isCustomDomain } from '@/_helpers/routes';
import { getPatToken } from '@/AppBuilder/EmbedApp';

export const sessionService = {
  validateSession,
  logout,
};

function validateSession(appId, workspaceSlug) {
  // Get PAT token if present (for embedded/PAT flows)
  const patToken = getPatToken && getPatToken();
  const headers = patToken ? { tj_auth_token: patToken } : undefined;
  const requestOptions = {
    method: 'GET',
    credentials: 'include',
    ...(headers && { headers }),
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
    // ✅ Notify parent if embedded
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'TJ_EMBED_APP_LOGOUT' }, '*');
    }
    const loginPath = (window.public_config?.SUB_PATH || '/') + 'login' + `${workspaceId ? `/${workspaceId}` : ''}`;
    if (avoidRedirection) {
      window.location.href = loginPath;
    } else {
      const pathname = getRedirectToWithParams(true);
      window.location.href = loginPath + `?redirectTo=${`${pathname.indexOf('/') === 0 ? '' : '/'}${pathname}`}`;
    }
  };

  const logoutCurrentDomain = fetch(`${config.apiUrl}/session/logout`, requestOptions)
    .then(handleResponseWithoutValidation);

  // On custom domains, also logout from the base domain to prevent
  // session transfer from re-authenticating the user after logout.
  if (isCustomDomain()) {
    const mainHost = stripTrailingSlash(window.public_config?.TOOLJET_HOST);
    if (mainHost) {
      const logoutBaseDomain = fetch(`${mainHost}/api/session/logout`, {
        method: 'GET',
        credentials: 'include',
      }).catch((err) => console.error('[logout] Base domain logout failed:', err));

      return Promise.all([logoutCurrentDomain, logoutBaseDomain])
        .catch((err) => console.error('[logout] Logout request failed:', err))
        .finally(() => redirectToLoginPage());
    }
  }

  return logoutCurrentDomain.finally(() => redirectToLoginPage());
}
