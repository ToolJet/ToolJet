import HttpClient from '@/_helpers/http-client';

// Constructed on first use, not at module load. These service modules are reachable from
// http-client's own import chain (http-client -> authentication.service -> '@/_helpers' -> ...
// -> the '@/_services' barrel), so a module-scope `new HttpClient()` can run while http-client
// is still initialising and has not exported the class yet.
let httpClient;
const getAdapter = () => (httpClient ??= new HttpClient());

function list({ status = 'all', limit = 20, before } = {}) {
  const params = new URLSearchParams({ status, limit: String(limit) });
  if (before) params.set('before', before);
  return getAdapter().get(`/notifications?${params.toString()}`);
}

function unreadCount() {
  return getAdapter().get(`/notifications/unread-count`);
}

function markRead(recipientId) {
  return getAdapter().patch(`/notifications/${recipientId}/read`, {});
}

function markAllRead() {
  return getAdapter().patch(`/notifications/read-all`, {});
}

function clearRead() {
  return getAdapter().delete(`/notifications/read`);
}

function remove(recipientId) {
  return getAdapter().delete(`/notifications/${recipientId}`);
}

export const notificationsService = { list, unreadCount, markRead, markAllRead, clearRead, remove };
