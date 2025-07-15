export type SourceOptions = {
  private_key?: string;
  client_email?: string;
  project_id?: string;
  instance_id?: string;
};

export type QueryOptions = {
  query_params?: [string, string][];
  param_types?: [string, string][];
  sql?: string;
  dialect?: Dialect;
  database_id?: string;
  options?: string;
};

export enum Dialect {
  Standard = "standard",
  Postgres = "postgresql",
}
