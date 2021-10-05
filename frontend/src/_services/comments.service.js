import HttpClient from '@/_helpers/http-client';

// TODO: antipattern to initialize a new instance @ every service
// TODO: use singleton pattern and move it to a static variable on page load
const adapter = new HttpClient();

function getThreads(appId) {
  return adapter.get(`/thread/${appId}/all`);
}

function createThread(data) {
  return adapter.post(`/thread/create`, data);
}

function updateThread(tid, data) {
  return adapter.patch(`/thread/edit/${tid}`, data);
}

function getComments(tid) {
  return adapter.get(`/comment/${tid}/all`);
}

function createComment(data) {
  return adapter.post(`/comment/create`, data);
}

function updateComment(cid, data) {
  return adapter.patch(`/comment/edit/${cid}`, data);
}

function deleteComment(cid) {
  return adapter.patch(`/comment/delete/${cid}`);
}

export const commentsService = {
  getThreads,
  createThread,
  updateThread,
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
