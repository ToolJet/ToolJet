export const defaultOptions = {
  postgresql: {
    host: { value: 'localhost' },
    port: { value: 5432 },
    database: { value: '' },
    username: { value: '' },
    password: { value: '' }
  },
  mysql: {
    host: { value: 'localhost' },
    port: { value: 3306 },
    database: { value: '' },
    username: { value: '' },
    password: { value: '' }
  },
  mssql: {
    host: { value: 'localhost' },
    port: { value: 3306 },
    database: { value: '' },
    username: { value: '' },
    password: { value: '' }
  },
  redis: {
    host: { value: 'localhost' },
    port: { value: 6379 },
    username: { value: '' },
    password: { value: '' }
  },
  mongodb: {
    database: { value: '' },
    host: { value: 'localhost' },
    port: { value: 27017 },
    username: { value: '' },
    password: { value: '' },
    connection_type: { value: 'manual' },
    connection_string: { value: ''}
  },
  
  elasticsearch: {
    scheme: { value: 'https' },
    host: { value: 'localhost' },
    port: { value: 9200 },
    username: { value: '' },
    password: { value: '' }
  },
  stripe: {
    api_key: { value: '' }
  },
  airtable: {
    api_key: { value: '' }
  },
  firestore: {
    gcp_key: { value: '' }
  },
  restapi: {
    url: { value: '' },
    auth_type: { value: 'none' },
    grant_type: { value: 'client_credentials' },
    add_token_to: { value: 'header' },
    header_prefix: { value: 'Bearer ' },
    access_token_url: { value: '' },
    client_id: { value: '' },
    client_secret: { value: '' },
    scopes: { value: 'read, write' },
    auth_url: { value: '' },
    client_auth: { value: 'header' },
    headers: { value: [['', '']] },
    custom_auth_params: { value: [['', '']] }
  },
  googlesheets: {
    access_type: { value: 'read' }
  },
  slack: {
    access_type: { value: 'read' }
  },
  dynamodb: {
    region: { value: ''},
    access_key: { value: ''},
    secret_key: { value: ''}
  }
};
