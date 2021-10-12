import HttpClient from '@/_helpers/http-client';

// TODO: antipattern to initialize a new instance @ every service
// TODO: use singleton pattern and move it to a static variable on page load
const adapter = new HttpClient();

function getThreads(appId) {
  return adapter.get(`/threads/${appId}/all`);
}

function createThread(data) {
  return adapter.post(`/threads/create`, data);
}

function updateThread(tid, data) {
  return adapter.patch(`/threads/edit/${tid}`, data);
}

function getComments(tid) {
  return adapter.get(`/comments/${tid}/all`);
}

function createComment(data) {
  return adapter.post(`/comments/create`, data);
}

function updateComment(cid, data) {
  return adapter.patch(`/comments/edit/${cid}`, data);
}

function deleteComment(cid) {
  return adapter.delete(`/comments/delete/${cid}`);
}

function getNotifications() {
  return adapter.get(`/comments/notifications`);
}

export const commentsService = {
  getThreads,
  createThread,
  updateThread,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getNotifications,
};
