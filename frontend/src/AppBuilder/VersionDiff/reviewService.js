import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

// Review requests on app versions (see server versions/reviews).
const request = (method, path, body) =>
  fetch(`${config.apiUrl}/v2/apps/${path}`, {
    method,
    headers: authHeader(),
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(handleResponse);

export const reviewService = {
  list: (appId, status) => request('GET', `${appId}/reviews${status ? `?status=${status}` : ''}`),
  get: (appId, reviewId) => request('GET', `${appId}/reviews/${reviewId}`),
  open: (appId, versionId, body) => request('POST', `${appId}/versions/${versionId}/reviews`, body),
  comment: (appId, reviewId, body, anchor) =>
    request('POST', `${appId}/reviews/${reviewId}/comments`, { body, anchor }),
  // fingerprint: the content the reviewer was shown; an approval of anything else is refused.
  decide: (appId, reviewId, decision, body, fingerprint) =>
    request('POST', `${appId}/reviews/${reviewId}/decision`, { decision, body, fingerprint }),
  override: (appId, reviewId, reason) => request('POST', `${appId}/reviews/${reviewId}/override`, { reason }),
  close: (appId, reviewId) => request('POST', `${appId}/reviews/${reviewId}/close`),
  reopen: (appId, reviewId) => request('POST', `${appId}/reviews/${reviewId}/reopen`),
  gate: (appId, versionId) => request('GET', `${appId}/versions/${versionId}/release-gate`),
};
