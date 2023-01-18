export const getRoute = (page, params = {}) => {
  const workspace_id = window.location.pathname.split('/')[1];
  const routes = {
    home_page: '/',
    editor: '/apps/:id/:pageHandle?',
    preview: '/applications/:id/versions/:versionId/:pageHandle?',
    released: '/applications/:id/versions/:versionId/:pageHandle?',
    authorize: '/applications/:id/versions/:versionId/:pageHandle?',
    workspace_settings: '/workspace-settings',
    settings: '/settings',
    database: '/database',
    integrations: '/integrations',
  };

  let url = routes[page];
  const urlParams = url.split('/').map((path) => {
    if (path.startsWith(':')) {
      return params[path.substring(1)];
    }
    return path;
  });
  url = urlParams.join('/');

  return `/${workspace_id}${url}`;
};
