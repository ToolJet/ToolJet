import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

//Uncomment when Comment Notifications Module is ready

function findAll(isRead = false) {
  return { data: [] };
  // return adapter.get(`/comment_notifications?isRead=${isRead}`);
}

function updateAll(isRead) {
  return;
  // return adapter.patch(`/comment_notifications`, { isRead });
}

function update(id, isRead) {
  return;
  // return adapter.patch(`/comment_notifications/${id}`, { isRead });
}

export const commentNotificationsService = {
  findAll,
  updateAll,
  update,
};
