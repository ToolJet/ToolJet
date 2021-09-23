import HttpClient from '@/_helpers/http-client'

// TODO: antipattern to initialize a new instance @ every service
// TODO: use singleton pattern and move it to a static variable on page load
const adapter = new HttpClient()

function getPositions() {
  return adapter.get('/comments/positions');
}

export const commentsService = {
  getPositions,
};