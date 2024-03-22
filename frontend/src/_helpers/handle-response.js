import { authenticationService } from '@/_services';

export function handleResponse(response, avoidRedirection = false) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      if ([401].indexOf(response.status) !== -1) {
        const errorMessageJson = typeof data.message === 'string' ? JSON.parse(data.message) : undefined;
        const workspaceId = errorMessageJson?.organizationId;
        avoidRedirection ? authenticationService.logout(false, workspaceId) : location.reload(true);
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
