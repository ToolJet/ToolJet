import config from 'config';
import { authenticationService } from '@/_services';

const HttpVerb = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
};

class HttpClient {
  constructor(args = {}) {
    this.host = args.host || config.apiUrl;
    this.namespace = args.namespace || ''; // TODO: add versioning (/v1) to all endpoints (https://docs.nestjs.com/techniques/versioning#uri-versioning-type)
    this.headers = {
      'content-type': 'application/json',
      Authorization: `Bearer ${authenticationService?.currentUserValue?.auth_token}`,
      ...args.headers,
    };
  }

  extractResponseHeaders(response) {
    const object = {};
    response.headers.forEach((value, key) => {
      object[key] = value;
    });
    return object;
  }

  async request(method, url, data) {
    const endpoint = this.host + this.namespace + url;
    const options = {
      method,
      headers: this.headers,
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(endpoint, options);
    const payload = {
      status: response.status,
      statusText: response.statusText,
      headers: this.extractResponseHeaders(response),
    };
    const text = await response.text();
    try {
      payload.data = JSON.parse(text);
      if (!response.ok) {
        // TODO: add 403 to the below [401] array?
        if ([401].indexOf(response.status) !== -1) {
          // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
          authenticationService.logout();
        }

        throw payload;
      }
    } catch (err) {
      payload.data = [];
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return payload;
    }
  }

  get(url) {
    return this.request(HttpVerb.Get, url);
  }

  post(url, data) {
    return this.request(HttpVerb.Post, url, data);
  }

  put(url, data) {
    return this.request(HttpVerb.Put, url, data);
  }

  patch(url, data) {
    return this.request(HttpVerb.Patch, url, data);
  }

  delete(url) {
    return this.request(HttpVerb.Delete, url);
  }
}

export default HttpClient;
