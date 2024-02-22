export type SourceOptions = {
  secret_key: string;
  access_key: string;
  workgroup_name: string;
  secretARN: string;
  database: string;
  region: string;
  useInstanceMetadataCredentials?: boolean;
  roleArn?: string;
};
export type QueryOptions = {
  operation: string;
  sql_query: string;
  mode: string;
};
export type AssumeRoleCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};
