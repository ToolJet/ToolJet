import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function getExtensions() {
  return adapter.get(`/extensions`);
}

function createThread(data) {
  return adapter.post(`/threads`, data);
}

function updateThread(threadId, data) {
  return adapter.patch(`/threads/${threadId}`, data);
}

function deleteThread(threadId) {
  return adapter.delete(`/threads/${threadId}`);
}

function getComments(threadId, appVersionsId) {
  return adapter.get(`/comments/${threadId}/all?appVersionsId=${appVersionsId}`);
}

function createComment(data) {
  return adapter.post(`/comments`, data);
}

function updateComment(commentId, data) {
  return adapter.patch(`/comments/${commentId}`, data);
}

function deleteComment(commentId) {
  return adapter.delete(`/comments/${commentId}`);
}

function getNotifications(appId, isResolved, appVersionsId) {
  return adapter.get(`/comments/${appId}/notifications?isResolved=${isResolved}&appVersionsId=${appVersionsId}`);
}

export const extensionsService = {
  getExtensions,
  createThread,
  updateThread,
  deleteThread,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getNotifications,
};
