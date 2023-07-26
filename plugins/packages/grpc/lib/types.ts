export type SourceOptions = {
  url: string;
  protobuf: string;
  auth_type: 'none' | 'basic' | 'bearer' | 'api_key';
  username?: string;
  password?: string;
  bearer_token?: string;
  grpc_apikey_key?: string;
  grpc_apikey_value?: string;
};
export type QueryOptions = {
  operation: string;
  serviceName: string;
  rpc: string;
  jsonMessage: string;
  metaDataOptions: string;
};
