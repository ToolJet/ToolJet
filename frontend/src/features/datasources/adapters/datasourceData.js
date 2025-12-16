// Dummy data for datasources
export const CommonlyUsedDataSources = [
  { key: 'restapi', name: 'REST API', kind: 'restapi', type: 'api' },
  { key: 'postgresql', name: 'PostgreSQL', kind: 'postgresql', type: 'database' },
  { key: 'mysql', name: 'MySQL', kind: 'mysql', type: 'database' },
];

export const DataBaseSources = [
  { key: 'mysql', name: 'MySQL', kind: 'mysql', type: 'database' },
  { key: 'postgresql', name: 'PostgreSQL', kind: 'postgresql', type: 'database' },
  { key: 'mongodb', name: 'MongoDB', kind: 'mongodb', type: 'database' },
  { key: 'mssql', name: 'MS SQL Server', kind: 'mssql', type: 'database' },
];

export const ApiSources = [
  { key: 'restapi', name: 'REST API', kind: 'restapi', type: 'api' },
  { key: 'graphql', name: 'GraphQL', kind: 'graphql', type: 'api' },
  { key: 'openapi', name: 'OpenAPI', kind: 'openapi', type: 'api' },
];

export const CloudStorageSources = [
  { key: 's3', name: 'Amazon S3', kind: 's3', type: 'cloud-storage' },
  { key: 'gcs', name: 'Google Cloud Storage', kind: 'gcs', type: 'cloud-storage' },
];

export const DUMMY_PLUGINS = [
  { id: 'plugin-1', name: 'Slack', kind: 'slack' },
  { id: 'plugin-2', name: 'Stripe', kind: 'stripe' },
];
