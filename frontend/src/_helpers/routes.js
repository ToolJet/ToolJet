/* You can add all paths and routes related utils here */
import { stripTrailingSlash, getWorkspaceId } from '@/_helpers/utils';
import { ERROR_TYPES } from './constants';
import { authenticationService } from '@/_services/authentication.service';
import queryString from 'query-string';
import _ from 'lodash';
import { eraseCookie, getCookie } from '.';

export const getPrivateRoute = (page, params = {}) => {
  const routes = {
    dashboard: '/',
    editor: '/apps/:slug/:pageHandle',
    preview: '/applications/:slug/versions/:versionId/:pageHandle',
    launch: '/applications/:slug/:pageHandle',
    workspace_settings: '/workspace-settings/users',
    settings: '/settings',
    database: '/database',
    integrations: '/integrations/marketplace',
    data_sources: '/data-sources',
    audit_logs: '/audit-logs',
    workflows: '/workflows',
    workspace_constants: '/workspace-constants',
    profile_settings: '/profile-settings',
  };

  let url = routes[page];
  const urlParams = url?.split('/').map((path) => {
    if (path.startsWith(':')) {
      return params[path.substring(1)];
    }
    return path;
  });
  url = urlParams.join('/');

  const workspaceId =
    getWorkspaceIdOrSlugFromURL() ||
    authenticationService.currentSessionValue?.current_organization_slug ||
    authenticationService.currentSessionValue?.current_organization_id;
  return `/${workspaceId}${url.replace(/\/$/, '')}`;
};

export const replaceEditorURL = (slug, pageHandle) => {
  const subpath = getSubpath();
  const path = subpath
    ? `${subpath}${getPrivateRoute('editor', { slug, pageHandle })}`
    : getPrivateRoute('editor', { slug, pageHandle });
  window.history.replaceState(null, null, path);
};

export function getQueryParams(query) {
  const search = window.location.search.substring(1); // Remove the '?' at the beginning
  const paramsArray = search.split('&');
  const queryParams = {};

  for (const param of paramsArray) {
    const [key, value] = param.split('=');
    if (key) queryParams[key] = decodeURIComponent(value);
  }

  return query ? queryParams[query] : queryParams;
}

export const pathnameToArray = () => window.location.pathname.split('/').filter((path) => path != '');

export const getPathname = (path, excludeSlug = false) => {
  const pathname = excludeSlug ? excludeWorkspaceIdFromURL(window.location.pathname) : window.location.pathname;
  return getSubpath() ? (path || pathname).replace(getSubpath(), '') : path || pathname;
};

export const getHostURL = () => `${window.public_config?.TOOLJET_HOST}${getSubpath() ?? ''}`;

export const dashboardUrl = (data, redirectTo, relativePath) => {
  const { current_organization_slug, current_organization_id } = authenticationService.currentSessionValue;
  const id_slug = data
    ? data?.current_organization_slug || data?.current_organization_id
    : current_organization_slug || current_organization_id || '';
  return getSubpath()
    ? `${getSubpath()}/${id_slug}${relativePath ? relativePath : ''}${redirectTo || ''}`
    : `/${id_slug}${relativePath ? relativePath : ''}${redirectTo || ''}`;
};

export const redirectToDashboard = (data, redirectTo, relativePath = null) => {
  window.location = dashboardUrl(data, redirectTo, relativePath); //Get URL from DashBoardUrl
};

export const redirectToSwitchOrArchivedAppPage = (data) => {
  let message = data?.message ?? '';
  const isApplicationsPath = getPathname(null, true).startsWith('/applications/');
  if (message && message == ERROR_TYPES.WORKSPACE_ARCHIVED) {
    const subpath = getSubpath();
    let path = subpath ? `${subpath}/switch-workspace` : `/switch-workspace`;
    if (isApplicationsPath) {
      path = 'app-url-archived';
    } else {
      path += '-archived';
    }
    window.location = path;
  }
};

export const appendWorkspaceId = (slug, path, replaceId = false) => {
  const subpath = getSubpath();
  path = getPathname(path);

  let newPath = path;
  if (path === '/:workspaceId' || path.split('/').length === 2 || path.includes('instance-settings')) {
    newPath = `/${slug}`;
  } else {
    const paths = path.split('/').filter((path) => path !== '');
    if (replaceId) {
      paths[0] = slug;
    } else {
      paths.unshift(slug);
    }
    newPath = `/${paths.join('/')}`;
  }
  return subpath ? `${subpath}${newPath}` : newPath;
};

export const getWorkspaceIdOrSlugFromURL = () => {
  const pathnameArray = pathnameToArray();
  const subpath = window?.public_config?.SUB_PATH;
  const subpathArray = subpath ? subpath.split('/').filter((path) => path != '') : [];
  const existedPaths = [
    'forgot-password',
    'switch-workspace',
    'switch-workspace-archived',
    'reset-password',
    'invitations',
    'organization-invitations',
    'sso',
    'setup',
    'confirm',
    ':workspaceId',
    'confirm-invite',
    'oauth2',
    'applications',
    'integrations',
    'settings',
    'licence',
    'error',
  ];

  const workspaceId = subpath ? pathnameArray[subpathArray.length] : pathnameArray[0];
  if (['login', 'ldap'].includes(workspaceId)) {
    if (pathnameArray[pathnameArray.length - 1] === 'super-admin') {
      return '';
    }
    return subpath ? pathnameArray[subpathArray.length + 1] : pathnameArray[1];
  }

  return !existedPaths.includes(workspaceId) ? workspaceId : '';
};

export const excludeWorkspaceIdFromURL = (pathname) => {
  const subPath = getSubpath();
  const tempPathname = subPath ? pathname.replace(subPath, '') : pathname;
  if (
    ![
      '/instance-settings',
      '/integrations',
      '/applications/',
      '/switch-workspace',
      '/switch-workspace-archived',
      '/organization-invitations/',
    ].find((path) => tempPathname.startsWith(path))
  ) {
    pathname = tempPathname;
    const paths = pathname?.split('/').filter((path) => path !== '');
    paths.shift();
    const newPath = paths.join('/');
    return newPath ? `/${newPath}` : '/';
  }
  return pathname;
};

export const getSubpath = () =>
  window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : null;

export const returnWorkspaceIdIfNeed = (path) => {
  if (path) {
    const paths = [
      '/applications/',
      '/integrations',
      '/instance-settings',
      '/organization-invitations/',
      '/invitations/',
    ];
    return !paths.find((subpath) => path.includes(subpath)) ? `/${getWorkspaceId()}` : '';
  }
  return `/${getWorkspaceId()}`;
};
export const getRedirectURL = (path) => {
  let redirectLoc = '/';
  if (path) {
    redirectLoc = `${returnWorkspaceIdIfNeed(path)}${path !== '/' ? path : ''}`;
  } else {
    const redirectTo = getRedirectTo();
    const { from } = redirectTo ? { from: { pathname: redirectTo } } : { from: { pathname: '/' } };
    if (from.pathname !== '/confirm')
      from.pathname = `${returnWorkspaceIdIfNeed(from.pathname)}${from.pathname !== '/' ? from.pathname : ''}`;
    redirectLoc = from.pathname;
  }

  return redirectLoc;
};

export const getRedirectTo = (paramObj) => {
  const params = paramObj || new URL(window.location.href).searchParams;
  let combined = Array.from(params.entries())
    .map((param) => param.join('='))
    .join('&');
  return params.get('redirectTo') ? combined.replace('redirectTo=', '') : '/';
};

export const getPreviewQueryParams = () => {
  const queryParams = getQueryParams();
  return {
    ...(queryParams['version'] && { version: queryParams.version }),
    ...(queryParams['env'] && { env: queryParams.env }),
  };
};

export const getRedirectToWithParams = (shouldAddCustomParams = false) => {
  const pathname = getPathname(null, true);
  let query = pathname.includes('/applications/') ? constructQueryParamsInOrder(shouldAddCustomParams) : '';
  return `${pathname}${query}`;
};

export const redirectToErrorPage = (errType, queryParams) => {
  const query = !_.isEmpty(queryParams) ? queryString.stringify(queryParams) : '';
  window.location = `${getHostURL()}/error/${errType}${!_.isEmpty(query) ? `?${query}` : ''}`;
};

/* TODO-reuse: Somewhere in the code we used same logic to construct preview params */
const constructQueryParamsInOrder = (shouldAddCustomParams = false) => {
  const { version, ...rest } = getQueryParams();
  const queryStr = shouldAddCustomParams && !_.isEmpty(rest) ? queryString.stringify(rest) : '';
  const previewParams = `${version ? `?version=${version}` : ''}`;
  return `${previewParams}${queryStr ? `${previewParams ? '&' : '?'}${queryStr}` : ''}`;
};

export const eraseRedirectUrl = () => {
  const redirectPath = getCookie('redirectPath');
  redirectPath && eraseCookie('redirectPath');
  return redirectPath;
};

export const redirectToWorkflows = (data, redirectTo, relativePath = null) => {
  const workflowUrl = `${dashboardUrl(data, redirectTo, relativePath)}/workflows`;
  window.location = workflowUrl;
};
