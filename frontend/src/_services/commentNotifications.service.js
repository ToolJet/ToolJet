import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function findAll(isRead = false) {
  return adapter.get(`/comment_notifications?isRead=${isRead}`);
}

function updateAll(isRead) {
  return adapter.patch(`/comment_notifications`, { isRead });
}

function update(id, isRead) {
  return adapter.patch(`/comment_notifications/${id}`, { isRead });
}

export const commentNotificationsService = {
  findAll,
  updateAll,
  update,
};
