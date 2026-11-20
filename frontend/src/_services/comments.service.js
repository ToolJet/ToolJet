import HttpClient from '@/_helpers/http-client';

// TODO: antipattern to initialize a new instance @ every service
// TODO: use singleton pattern and move it to a static variable on page load
// Constructed on first use, not at module load. These service modules are reachable from
// http-client's own import chain (http-client -> authentication.service -> '@/_helpers' -> ...
// -> the '@/_services' barrel), so a module-scope `new HttpClient()` can run while http-client
// is still initialising and has not exported the class yet.
let httpClient;
const getAdapter = () => (httpClient ??= new HttpClient());

function getThreads(appId, appVersionsId) {
  return getAdapter().get(`/threads/${appId}/all?appVersionsId=${appVersionsId}`);
}

function createThread(data) {
  return getAdapter().post(`/threads`, data);
}

function updateThread(threadId, data) {
  return getAdapter().patch(`/threads/${threadId}`, data);
}

function deleteThread(threadId) {
  return getAdapter().delete(`/threads/${threadId}`);
}

function getComments(threadId, appVersionsId) {
  return getAdapter().get(`/comments/${threadId}/all?appVersionsId=${appVersionsId}`);
}

function createComment(data) {
  return getAdapter().post(`/comments`, data);
}

function updateComment(commentId, data) {
  return getAdapter().patch(`/comments/${commentId}`, data);
}

function deleteComment(commentId) {
  return getAdapter().delete(`/comments/${commentId}`);
}

function getNotifications(appId, isResolved, appVersionsId, pageId) {
  return getAdapter().get(
    `/comments/${appId}/notifications?isResolved=${isResolved}&appVersionsId=${appVersionsId}&pageId=${pageId}`
  );
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
