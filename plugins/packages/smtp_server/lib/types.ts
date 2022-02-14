export type SourceOptions = {
  host: string; 
  port: string; 
  user: string;
  password: string;
};
export type QueryOptions = {
  operation: string;
  from:string,
  to:string,
  subject:string,
  content_type:string,
  content:string
};