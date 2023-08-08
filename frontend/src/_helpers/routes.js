import { getSubpath, getWorkspaceIdOrSlugFromURL } from '@/_helpers/utils';
import { authenticationService } from '@/_services/authentication.service';

//TODO: test dashboard menu items
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
    global_datasources: '/global-datasources',
  };

  let url = routes[page];
  const urlParams = url?.split('/').map((path) => {
    if (path.startsWith(':')) {
      return params[path.substring(1)];
    }
    return path;
  });
  url = urlParams.join('/');

  return appendWorkspaceId(url.replace(/\/$/, ''));
};

const appendWorkspaceId = (url) => {
  const workspaceId =
    getWorkspaceIdOrSlugFromURL() ||
    authenticationService.currentSessionValue?.current_organization_slug ||
    authenticationService.currentSessionValue?.current_organization_id;
  return `/${workspaceId}${url}`;
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
