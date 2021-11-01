import HttpClient from '@/_helpers/http-client';

// TODO: antipattern to initialize a new instance @ every service
// TODO: use singleton pattern and move it to a static variable on page load
const adapter = new HttpClient();

function getThreads(appId, appVersionsId) {
  return adapter.get(`/threads/${appId}/all?appVersionsId=${appVersionsId}`);
}

function createThread(data) {
  return adapter.post(`/threads/create`, data);
}

function updateThread(threadId, data) {
  return adapter.patch(`/threads/edit/${threadId}`, data);
}

function deleteThread(threadId) {
  return adapter.delete(`/threads/delete/${threadId}`);
}

function getComments(threadId, appVersionsId) {
  return adapter.get(`/comments/${threadId}/all?appVersionsId=${appVersionsId}`);
}

function createComment(data) {
  return adapter.post(`/comments/create`, data);
}

function updateComment(commentId, data) {
  return adapter.patch(`/comments/edit/${commentId}`, data);
}

function deleteComment(commentId) {
  return adapter.delete(`/comments/delete/${commentId}`);
}

function getNotifications(appId, isResolved, appVersionsId) {
  return adapter.get(`/comments/${appId}/notifications?isResolved=${isResolved}&appVersionsId=${appVersionsId}`);
}

export const commentsService = {
  getThreads,
  createThread,
  updateThread,
  deleteThread,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getNotifications,
};
