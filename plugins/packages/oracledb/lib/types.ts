export type SourceOptions = { 
  database: string; 
  database_type: string; 
  host: string; 
  port: string; 
  username: string;
  password: string;
  ssl_enabled: boolean; 
};
export type QueryOptions = { 
  operation: string;
  query: string;
  mode: string;
};