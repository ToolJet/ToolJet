import config from 'config';
import { authHeader, handleResponseWithoutValidation } from '@/_helpers';
import { defaultWhiteLabellingSettings, whiteLabellingOptions } from '@/_stores/utils';

export const whiteLabellingService = {
  get,
  update,
};

function get(key, organizationId, organizationSlug) {
  const headers = authHeader();
  const workspaceId = headers['tj-workspace-id'];
  if (!organizationId && !workspaceId && !organizationSlug) {
    const defaultSettings = Object.keys(whiteLabellingOptions).reduce((settings, optionKey) => {
      const defaultKey = optionKey;
      settings[whiteLabellingOptions[optionKey]] = defaultWhiteLabellingSettings[defaultKey];
      return settings;
    }, {});
    return Promise.resolve(defaultSettings);
  }
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  let url;
  if (organizationSlug) {
    url = key
      ? `${config.apiUrl}/white-labelling/by-slug/${organizationSlug}?key=${encodeURIComponent(key)}`
      : `${config.apiUrl}/white-labelling/by-slug/${organizationSlug}`;
  } else {
    url = key
      ? `${config.apiUrl}/white-labelling/${workspaceId || organizationId}?key=${encodeURIComponent(key)}`
      : `${config.apiUrl}/white-labelling/${workspaceId || organizationId}`;
  }
  return fetch(url, requestOptions).then(handleResponseWithoutValidation);
}

function update(settings) {
  const headers = authHeader();
  const organizationId = headers['tj-workspace-id'];
  const requestOptions = {
    method: 'PUT',
    headers: authHeader(),
    credentials: 'include',
    body: JSON.stringify(settings),
  };
  return fetch(`${config.apiUrl}/white-labelling/${organizationId}`, requestOptions).then(
    handleResponseWithoutValidation
  );
}
