import HttpClient from '@/_helpers/http-client'

const adapter = new HttpClient()

function getPositions() {
  return adapter.get('/comments/positions');
}

export const commentsService = {
  getPositions,
};