export type SourceOptions = {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  instance_url: string;
  access_token: string;
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
