import HttpClient from '@/_helpers/http-client'

// TODO: antipattern to initialize a new instance @ every service
// TODO: use singleton pattern and move it to a static variable on page load
// TODO: add authheader
const adapter = new HttpClient()

function getPositions() {
  return adapter.get('/comments/positions');
}

function getComment(id) {
  return adapter.get(`/comments/${id}`);
}

export const commentsService = {
  getPositions,
  getComment
};