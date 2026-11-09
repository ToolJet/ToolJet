import HttpClient from '@/_helpers/http-client';
import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

// Constructed on first use, not at module load. These service modules are reachable from
// http-client's own import chain (http-client -> authentication.service -> '@/_helpers' -> ...
// -> the '@/_services' barrel), so a module-scope `new HttpClient()` can run while http-client
// is still initialising and has not exported the class yet.
let httpClient;
const getAdapter = () => (httpClient ??= new HttpClient());

function findAll() {
  return getAdapter().get(`/plugins`);
}

function installPlugin(body) {
  return getAdapter().post(`/plugins/install`, body);
}

function updatePlugin(body) {
  return getAdapter().patch(`/plugins/${body.id}`, body);
}

function deletePlugin(id) {
  return getAdapter().delete(`/plugins/${id}`);
}

function reloadPlugin(id) {
  return getAdapter().post(`/plugins/${id}/reload`);
}

function findDependentPlugins(dataSources) {
  return getAdapter().post(`/plugins/findDependentPlugins`, dataSources);
}

function installDependentPlugins(dependentPlugins, shouldAutoImportPlugin) {
  const body = {
    dependentPlugins,
    shouldAutoImportPlugin,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };
  return fetch(`${config.apiUrl}/plugins/installDependentPlugins`, requestOptions).then(handleResponse);
}

function uninstallPlugins(pluginsId) {
  const body = {
    pluginsId: pluginsId,
  };

  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(body),
  };

  return fetch(`${config.apiUrl}/plugins/uninstallPlugins`, requestOptions).then(handleResponse);
}

export const pluginsService = {
  findAll,
  installPlugin,
  updatePlugin,
  deletePlugin,
  reloadPlugin,
  findDependentPlugins,
  installDependentPlugins,
  uninstallPlugins,
};
