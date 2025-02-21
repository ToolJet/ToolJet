export type SourceOptions = {
  connection_type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  bucket: string;
  scope: string;
  collection: string;
  connection_string: string;
};

export type QueryOptions = {
  operation: string;
  document_id?: string;
  collection: string;
  document: string;
  options: string;
  filter: string;
  documents: string;
  update: string;
  field: string;
  replacement: string;
  operations: string;
  query: string;
  parameters: string;
};