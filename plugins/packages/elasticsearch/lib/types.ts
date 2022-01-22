export type SourceOptions = { scheme: string; host: string; port: string; username: string; password: string; }
export type QueryOptions = { 
  index: string; 
  query: string; 
  body: string; 
  id: string; 
  operation: string;
};