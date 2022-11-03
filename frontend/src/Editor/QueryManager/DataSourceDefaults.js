export const dataSourceDefaultValue = {
  athena: { mode: 'sql' },
  clickhouse: { operation: 'sql' },
  elasticsearch: {
    query: '',
    operation: 'search',
  },
  firestore: {
    path: '',
    operation: 'get_document',
    order_type: 'desc',
  },
  googlesheets: {
    operation: 'read',
  },
  mariadb: {
    mode: 'sql',
  },
  mongodb: {
    document: '{ }',
  },
  postgresql: {
    mode: 'sql',
  },
  redis: {
    query: 'PING',
  },
  restapi: {
    method: 'get',
    url: '',
    headers: [['', '']],
    url_params: [['', '']],
    body: [['', '']],
    json_body: null,
    body_toggle: false,
  },
  s3: {
    maxKeys: 1000,
  },
  saphana: {
    mode: 'sql',
  },
  smtp: {
    content_type: {
      value: 'plain_text',
    },
  },
  snowflake: {
    mode: 'sql',
  },
  typesense: {
    query: '',
    operation: 'search',
  },
};
