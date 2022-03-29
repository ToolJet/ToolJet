export type SourceOptions = {
  api_token: string;
  database: string;
  port: string;
  host: string;
  protocol: string;
};
export type QueryOptions = {
  operation: string;
  org: string;
  bucket: string;
  bucket_id: string;
  precision?: string;
  name: string;
  body: string;
  orgID: string;
};
