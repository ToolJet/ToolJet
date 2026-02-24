import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const supportService = {
  startLogCapture,
  stopLogCapture,
  downloadLogs,
  getStatus,
};

function startLogCapture() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/internal/support/start-capture`, requestOptions).then(handleResponse);
}

function stopLogCapture() {
  const requestOptions = {
    method: 'POST',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/internal/support/stop-capture`, requestOptions).then(handleResponse);
}

function downloadLogs() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/internal/support/download`, requestOptions);
}

function getStatus() {
  const requestOptions = {
    method: 'GET',
    headers: authHeader(),
    credentials: 'include',
  };
  return fetch(`${config.apiUrl}/internal/support/status`, requestOptions).then(handleResponse);
}
