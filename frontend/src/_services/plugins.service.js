import HttpClient from '@/_helpers/http-client';
import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

const adapter = new HttpClient();

function findAll() {
  return adapter.get(`/plugins`);
}

function installPlugin(body) {
  return adapter.post(`/plugins/install`, body);
}

function updatePlugin(body) {
  return adapter.patch(`/plugins/${body.id}`, body);
}

function deletePlugin(id) {
  return adapter.delete(`/plugins/${id}`);
}

function reloadPlugin(id) {
  return adapter.post(`/plugins/${id}/reload`);
}

function findDependentPlugins(dataSources) {
  return adapter.post(`/plugins/findDependentPlugins`, dataSources);
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
