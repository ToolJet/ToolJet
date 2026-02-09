export type SourceOptions = {
  instance_url: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token: string;
  grant_type: string;
  multiple_auth_enabled: boolean;
  tokenData: any;
  auth_type?: string;
};
export type QueryOptions = {
  operation: string;
  language: string;
  soql_query: string;
  actiontype: string;
  resource_id: string;
  resource_name: string;
  resource_body: object;
  crud_action: 'insert' | 'update' | 'upsert' | 'delete' | 'hardDelete' | 'query';
  object_type: string;
  options: string;
  records: string;
  methodtype: string;
  path: string;
  body: string;
};
