export const dataBaseSources = [
  {
    name: 'PostgreSQL',
    kind: 'postgresql',
    options: {
      host: { type: 'string' },
      port: { type: 'string' },
      database: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string', encrypted: true }
    },
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    }
  },
  {
    name: 'MySQL',
    kind: 'mysql',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      host: { type: 'string' },
      port: { type: 'string' },
      database: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string', encrypted: true }
    }
  },
  {
    name: 'SQL Server',
    kind: 'mssql',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      host: { type: 'string' },
      port: { type: 'string' },
      database: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string', encrypted: true }
    }
  },
  {
    name: 'MongoDB',
    kind: 'mongodb',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      host: { type: 'string' },
      port: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string', encrypted: true },
      connection_type: { type: 'options'},
      connection_string: { type: 'string', encrypted: true }
    }
  },
  {
    name: 'Firestore',
    kind: 'firestore',
    exposedVariables: {
      isLoading: {},
      data: [],
      rawData: []
    },
    options: {
      gcp_key: { type: 'string', encrypted: true }
    }
  },
  {
    name: 'DynamoDB',
    kind: 'dynamodb',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      region: { type: 'string' },
      access_key: { type: 'string' },
      secret_key: { type: 'string', encrypted: true }
    }
  },
  {
    name: 'Elasticsearch',
    kind: 'elasticsearch',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      host: { type: 'string' },
      port: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string', encrypted: true }
    }
  },
  {
    name: 'Redis',
    kind: 'redis',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      host: { type: 'string' },
      port: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string', encrypted: true }
    }
  }
];

export const apiSources = [
  {
    name: 'Rest API',
    kind: 'restapi',
    options: {
      url: { type: 'string' },
      auth_type: { type: 'string' },
      grant_type: { type: 'string' },
      add_token_to: { type: 'string' },
      header_prefix: { type: 'string' },
      access_token_url: { type: 'string' },
      client_id: { type: 'string' },
      client_secret: { type: 'string', encrypted: true },
      scopes: { type: 'string' },
      auth_url: { type: 'string' },
      client_auth: { type: 'string' },
      headers: { type: 'array' },
      custom_auth_params: { type: 'array' }
    },
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    customTesting: true
  },
  {
    name: 'GraphQL',
    kind: 'graphql',
    options: {
      url: { type: 'string' },
      headers: { type: 'array' },
      url_params: { type: 'array' },
      body: { type: 'array' },
    },
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    customTesting: true
  },
  {
    name: 'Stripe',
    kind: 'stripe',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      api_key: { type: 'string', encrypted: true }
    },
    customTesting: true
  },
  {
    name: 'Airtable',
    kind: 'airtable',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      api_key: { type: 'string', encrypted: true }
    },
    customTesting: true
  },
  {
    name: 'Google Sheets',
    kind: 'googlesheets',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      api_key: { type: 'string', encrypted: true }
    },
    customTesting: true,
    hideSave: true
  },
  {
    name: 'Slack',
    kind: 'slack',
    exposedVariables: {
      isLoading: {},
      data: {},
      rawData: {}
    },
    options: {
      api_key: { type: 'string', encrypted: true }
    },
    customTesting: true,
    hideSave: true
  }
];

export const DataSourceTypes = [
  ...dataBaseSources,
  ...apiSources
];
