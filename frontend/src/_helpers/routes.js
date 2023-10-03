/* You can add all paths and routes related utils here */
import { stripTrailingSlash, getWorkspaceId } from '@/_helpers/utils';
import { authenticationService } from '@/_services/authentication.service';
import queryString from 'query-string';
import _ from 'lodash';

export const getPrivateRoute = (page, params = {}) => {
  const routes = {
    dashboard: '/',
    editor: '/apps/:slug/:pageHandle',
    preview: '/applications/:slug/versions/:versionId/:pageHandle',
    launch: '/applications/:slug/:pageHandle',
    workspace_settings: '/workspace-settings',
    settings: '/settings',
    database: '/database',
    integrations: '/integrations',
    data_sources: '/data-sources',
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
    queryParams[key] = decodeURIComponent(value);
  }

  return query ? queryParams[query] : queryParams;
}

export const pathnameToArray = () => window.location.pathname.split('/').filter((path) => path != '');

export const getPathname = (path, excludeSlug = false) => {
  const pathname = excludeSlug ? excludeWorkspaceIdFromURL(window.location.pathname) : window.location.pathname;
  return getSubpath() ? (path || pathname).replace(getSubpath(), '') : path || pathname;
};

export const getHostURL = () => `${window.public_config?.TOOLJET_HOST}${getSubpath() ?? ''}`;

export const redirectToDashboard = (data) => {
  const { current_organization_slug, current_organization_id } = authenticationService.currentSessionValue;
  const id_slug = data
    ? data?.current_organization_slug || data?.current_organization_id
    : current_organization_slug || current_organization_id || '';
  window.location = getSubpath() ? `${getSubpath()}/${id_slug}` : `/${id_slug}`;
};

export const appendWorkspaceId = (slug, path, replaceId = false) => {
  const subpath = getSubpath();
  path = getPathname(path);

  let newPath = path;
  if (path === '/:workspaceId' || path.split('/').length === 2) {
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
  ];

  const workspaceId = subpath ? pathnameArray[subpathArray.length] : pathnameArray[0];
  if (workspaceId === 'login') {
    return subpath ? pathnameArray[subpathArray.length + 1] : pathnameArray[1];
  }

  return !existedPaths.includes(workspaceId) ? workspaceId : '';
};

export const excludeWorkspaceIdFromURL = (pathname) => {
  if (!['integrations', 'applications'].find((path) => pathname.includes(path))) {
    pathname = getSubpath() ? pathname.replace(getSubpath(), '') : pathname;
    const paths = pathname?.split('/').filter((path) => path !== '');
    paths.shift();
    const newPath = paths.join('/');
    return newPath ? `/${newPath}` : '/';
  }
  return pathname;
};

export const getSubpath = () =>
  window?.public_config?.SUB_PATH ? stripTrailingSlash(window?.public_config?.SUB_PATH) : null;

const returnWorkspaceIdIfNeed = (path) => {
  if (path) {
    return !path.includes('applications') && !path.includes('integrations') ? `/${getWorkspaceId()}` : '';
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

export const getRedirectTo = () => {
  const params = new URL(window.location.href).searchParams;
  return params.get('redirectTo') || '/';
};

export const getPreviewQueryParams = () => {
  const queryParams = getQueryParams();
  return {
    ...(queryParams['version'] && { version: queryParams.version }),
  };
};

export const getRedirectToWithParams = () => {
  const pathname = getPathname(null, true);
  const queryParams = pathname.includes('/applications/') ? getPreviewQueryParams() : {};
  const query = !_.isEmpty(queryParams) ? queryString.stringify(queryParams) : '';
  return `${pathname}${!_.isEmpty(query) ? `?${query}` : ''}`;
};
