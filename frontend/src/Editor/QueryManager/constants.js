export const defaultOptions = {
  postgresql: {},
  redis: {
    query: 'PING'
  },
  mysql: {},
  firestore: {
    path: ''
  },
  elasticsearch: {
    query: ''
  },
  restapi: {
    method: 'GET',
    url: null,
    url_params: [],
    headers: [],
    body: []
  },
  stripe: {},
  mongodb: {},
  googlesheets: {
    operation: 'read'
  },
  slack: {
    
  },
  dynamodb: {
    
  }
};
