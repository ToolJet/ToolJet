export type SourceOptions = {
  username: string;
  password: string;
  database: string;  
  port: string;
  host:string;
};
export type QueryOptions = {
  operation: string;
  doc_name: string;
  recordId: string;
  body: string;
  rev_id:string;
};
