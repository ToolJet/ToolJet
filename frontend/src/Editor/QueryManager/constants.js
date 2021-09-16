export const defaultOptions = {
  postgresql: {
    mode: 'sql',
  },
  redis: {
    query: 'PING',
  },
  mysql: {},
  graphql: {},
  firestore: {
    path: '',
    operation: 'get_document',
  },
  elasticsearch: {
    query: '',
    operation: 'search',
  },
  restapi: {
    method: 'get',
    url: null,
    url_params: [],
    headers: [],
    body: [],
  },
  stripe: {},
  mongodb: {
    document: '{ }',
  },
  googlesheets: {
    operation: 'read',
  },
  slack: {},
  dynamodb: {},
  airtable: {},
  mssql: {},
};
