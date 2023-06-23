export type SourceOptions = {
  access_key: string;
  secret_key: string;
  region: string;
  useInstanceMetadataCredentials?: boolean;
  roleArn?: string;
};
export type QueryOptions = {
  table: string;
  key: string;
  scan_condition: string;
  query_condition: string;
  operation: string;
  update_condition: string;
  table_parameters: string;
};

export type AssumeRoleCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};
