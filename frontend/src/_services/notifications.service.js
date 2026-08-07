import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function list({ status = 'all', limit = 20, before } = {}) {
  const params = new URLSearchParams({ status, limit: String(limit) });
  if (before) params.set('before', before);
  return adapter.get(`/notifications?${params.toString()}`);
}

function unreadCount() {
  return adapter.get(`/notifications/unread-count`);
}

function markRead(recipientId) {
  return adapter.patch(`/notifications/${recipientId}/read`, {});
}

function markAllRead() {
  return adapter.patch(`/notifications/read-all`, {});
}

function clearRead() {
  return adapter.delete(`/notifications/read`);
}

function remove(recipientId) {
  return adapter.delete(`/notifications/${recipientId}`);
}

export const notificationsService = { list, unreadCount, markRead, markAllRead, clearRead, remove };
