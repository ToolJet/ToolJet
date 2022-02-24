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
  record_id: string;
  body: string;
  rev_id:string;
  view_url:string;
  start_key:string;
  end_key:string;
  limit:string;
  skip:string;
};
