import { authenticationService } from '@/_services';

export function handleResponse(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      if ([401].indexOf(response.status) !== -1) {
        // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
        authenticationService.logout();
        // location.reload(true);
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject({ error, data, statusCode: response?.status });
    }

    return data;
  });
}
export function handleResponseWithoutValidation(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      const error = (data && data.message) || response.statusText;
      return Promise.reject({ error, data });
    }

    return data;
  });
}

export const handleErrConnections = (error) => {
  if (
    error?.message === 'Failed to fetch' ||
    (!['127.0.0.1', 'localhost'].includes(location.hostname) && !window.navigator.onLine)
  ) {
    return Promise.reject({ statusCode: 503, error });
  }
  return Promise.reject(error);
};
