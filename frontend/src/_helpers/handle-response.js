import { authenticationService } from '@/_services';
import config from 'config';

export function handleResponse(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      if ([401].indexOf(response.status) !== -1) {
        // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
        authenticationService.logout();
        // location.reload(true);
      }
      handleSpecificAPIErrors(response);

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

/*
  This fn can be used for handling specific API cases and status code
  Later. we can improvise the code with switch 
*/
const handleSpecificAPIErrors = (response) => {
  const { url, status } = response;
  const { apiUrl } = config;

  var index = url.indexOf(apiUrl);
  const endpoint = url.substring(index + apiUrl.length);

  if (endpoint.includes('/apps/slugs/')) {
    if ([403].indexOf(status) !== -1) {
      authenticationService.logout();
    }
  }
};
