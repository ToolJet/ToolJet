import config from 'config';
import { authenticationService } from '@/_services';
import { sessionService } from '@/_services/session.service';
import urlJoin from 'url-join';
import { isEmpty } from 'lodash';
import { handleUnSubscription } from '@/_helpers/utils';

// Track pending SSO info refresh to avoid duplicate requests
let ssoInfoRefreshPromise = null;

/**
 * Refreshes the session when OIDC tokens have been updated on the backend.
 * Called when response contains X-SSO-Info-Updated header.
 */
async function refreshSsoInfo() {
  // Dedupe concurrent refresh requests
  if (ssoInfoRefreshPromise) {
    return ssoInfoRefreshPromise;
  }

  ssoInfoRefreshPromise = (async () => {
    try {
      const newSession = await sessionService.validateSession();
      if (newSession && !newSession.authentication_failed) {
        authenticationService.updateCurrentSession(newSession);
      }
    } catch (error) {
      console.warn('[SSO Info Refresh] Failed to refresh session:', error);
    } finally {
      ssoInfoRefreshPromise = null;
    }
  })();

  return ssoInfoRefreshPromise;
}

const HttpVerb = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
};

class HttpClient {
  constructor(args = {}) {
    this._host = args.host;
    this._hostFn = args.hostFn;
    this.namespace = args.namespace || ''; // TODO: add versioning (/v1) to all endpoints (https://docs.nestjs.com/techniques/versioning#uri-versioning-type)
    this.headers = {
      'content-type': 'application/json',
      ...args.headers,
    };
  }

  // Lazy getter: config.apiUrl is mutated after module load on custom domains
  // (see index.jsx), so we must read it at request time, not construction time.
  get host() {
    if (this._hostFn) return this._hostFn();
    return this._host ?? config.apiUrl;
  }

  extractResponseHeaders(response) {
    const object = {};
    response.headers.forEach((value, key) => {
      object[key] = value;
    });
    return object;
  }

  async request(method, url, headers, data) {
    const endpoint = urlJoin(this.host, this.namespace, url);
    const options = {
      method,
      headers: { ...this.headers, ...headers },
      credentials: 'include',
    };
    let session = authenticationService.currentSessionValue;

    let subsciption;
    if (!subsciption || (subsciption?.isClosed && subsciption?.isStopped)) {
      subsciption = authenticationService.currentSession.subscribe((newSession) => {
        session = newSession;
      });
      handleUnSubscription(subsciption);
    }

    options.headers['tj-workspace-id'] = session?.current_organization_id;

    if (data) {
      // fetch library generates content type with boundary for form data
      data instanceof FormData && delete options.headers['content-type'];
      options.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);
    const payload = {
      status: response.status,
      statusText: response.statusText,
      headers: this.extractResponseHeaders(response),
    };

    // Check if OIDC tokens were refreshed on the backend
    // Trigger async session refresh to update globals.currentUser.ssoUserInfo
    if (response.headers.get('X-SSO-Info-Updated') === 'true') {
      refreshSsoInfo(); // Fire-and-forget — don't block the current request
    }

    const text = await response.text();
    try {
      payload.data = isEmpty(text) ? text : JSON.parse(text);
      if (!response.ok) {
        // TODO: add 403 to the below [401] array?
        if ([401].indexOf(response.status) !== -1) {
          // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
          location.reload();
        }

        throw payload;
      }
    } catch (err) {
      payload.data = [];
      payload.error = !isEmpty(text) && JSON.parse(text);
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return payload;
    }
  }

  get(url, headers = {}) {
    return this.request(HttpVerb.Get, url, headers);
  }

  post(url, data, headers = {}) {
    return this.request(HttpVerb.Post, url, headers, data);
  }

  put(url, data, headers = {}) {
    return this.request(HttpVerb.Put, url, headers, data);
  }

  patch(url, data, headers = {}) {
    return this.request(HttpVerb.Patch, url, headers, data);
  }

  delete(url, headers = {}) {
    return this.request(HttpVerb.Delete, url, headers);
  }
}

export default HttpClient;
