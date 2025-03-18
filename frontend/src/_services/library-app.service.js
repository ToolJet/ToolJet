import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const libraryAppService = {
  deploy,
  templateManifests,
  createSampleApp,
  findDependentPluginsInTemplate,
};

function deploy(identifier, appName, dependentPluginsForTemplate = [], shouldAutoImportPlugin = false) {
  const body = {
    identifier,
    appName,
    dependentPluginsForTemplate,
    shouldAutoImportPlugin,
  };

  const requestOptions = { method: 'POST', headers: authHeader(), credentials: 'include', body: JSON.stringify(body) };
  return fetch(`${config.apiUrl}/library_apps`, requestOptions).then(handleResponse);
}

function templateManifests() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/library_apps`, requestOptions).then(handleResponse);
}

function createSampleApp() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/library_apps/sample-app`, requestOptions).then(handleResponse);
}

function findDependentPluginsInTemplate(identifier) {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/library_apps/${identifier}/plugins`, requestOptions).then(handleResponse);
}
