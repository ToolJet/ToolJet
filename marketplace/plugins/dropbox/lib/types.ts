export type SourceOptions = {
  client_id?: {
    value: string;
  };
  client_secret?: {
    value: string;
  };
  tj_redirect_host?: {
    value: string;
  };
};

export type QueryOptions = {
  operation: string;
  path?: string;
  from_path?: string;
  to_path?: string;
  query?: string;
  file_content?: string;
  encoding?: 'utf8' | 'base64';
};
