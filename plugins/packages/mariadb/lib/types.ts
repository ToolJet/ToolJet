export type SourceOptions = {
  host: string;
  user: string;
  password: string;
  connectionLimit: string;
  port: string;
  database: string;
  ssl_certificate: string;
  ssl_enabled: boolean;
  connectTimeout: string;
  minConnections: string;
  ca: string;
  cert: string;
  key: string;
};
export type QueryOptions = {
  operation: string;
  query: string;
};
