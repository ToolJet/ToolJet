export const defaultOptions = {
  postgresql: {},
  redis: {
    query: 'PING'
  },
  mysql: {},
  graphql: {},
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
  mongodb: {
    document: '{ }'
  },
  googlesheets: {
    operation: 'read'
  },
  slack: {
    
  },
  dynamodb: {
    
  },
  airtable: {
    
  }
};
