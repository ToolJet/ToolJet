import { authenticationService } from '@/_services';

export function handleResponse(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      const pathnames = location.pathname.split('/').filter((path) => path !== '');
      if ([401].indexOf(response.status) !== -1 && !pathnames.length === 2 && !pathnames.includes('login')) {
        // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
        authenticationService.logout();
        // location.reload(true);
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject({ error, data });
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
