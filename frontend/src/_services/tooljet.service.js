import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const tooljetService = {
  fetchMetaData,
  skipVersion
};

function fetchMetaData() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader()
  };

  return fetch(`${config.apiUrl}/metadata`, requestOptions).then(handleResponse);
}

function skipVersion() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader()
  };

  return fetch(`${config.apiUrl}/metadata/skip_version`, requestOptions).then(handleResponse);
}