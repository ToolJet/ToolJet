export type SourceOptions = {
  db_auth_username: string;
  db_auth_password: string;
  db_config_catalog: string;
  db_config_host: string;
  db_config_port: number;
  db_config_schema: string;
  db_config_user: string;
  db_config_timezone: string;
  db_config_extra_headers: [string, string][];
};
export type QueryOptions = {
  operation: string;
  presto_sql_query: string;
};