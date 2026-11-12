// Queries whose code gets the "Code" label and can open in its own browser tab: the option that holds the
// code, the editor language, and the name shown in the tab. Data source kinds and option keys come from
// each plugin's manifest and operations.json. A key may be one level deep ('sql_execution.sqlQuery').
const sql = (key) => ({ key, lang: 'sql', label: 'SQL' });

const QUERY_CODE_FIELDS = {
  runjs: { key: 'code', lang: 'javascript', label: 'JavaScript' },
  runpy: { key: 'code', lang: 'python', label: 'Python' },
  postgresql: sql('query'),
  mysql: sql('query'),
  mariadb: sql('query'),
  mssql: sql('query'),
  oracledb: sql('query'),
  snowflake: sql('query'),
  databricks: sql('sql_query'),
  ibmdb: sql('query'),
  saphana: sql('query'),
  bigquery: sql('query'),
  clickhouse: sql('query'),
  athena: sql('query'),
  tooljetdb: sql('sql_execution.sqlQuery'),
  // Marketplace plugins
  spanner: sql('sql'),
  awsredshift: sql('sql_query'),
  Presto: sql('presto_sql_query'),
  harperdb: sql('sql_query'),
  couchbase: { key: 'query', lang: 'sql', label: 'SQL++' },
  salesforce: { key: 'soql_query', lang: 'sql', label: 'SOQL' },
};

export const getQueryCodeField = (kind) => QUERY_CODE_FIELDS[kind] ?? null;

// The query's code, and its options with the code replaced (other options, including siblings of a nested
// key, are kept).
export const getQueryCode = (kind, options) => {
  const field = getQueryCodeField(kind);
  if (!field) return undefined;
  const [head, nested] = field.key.split('.');
  return nested ? options?.[head]?.[nested] : options?.[head];
};

export const withQueryCode = (kind, options, code) => {
  const [head, nested] = getQueryCodeField(kind).key.split('.');
  return { ...options, [head]: nested ? { ...options?.[head], [nested]: code } : code };
};

// Whether `fieldKey` is that query kind's code field (data source forms render many code boxes).
export const isQueryCodeField = (kind, fieldKey) => getQueryCodeField(kind)?.key === fieldKey;
