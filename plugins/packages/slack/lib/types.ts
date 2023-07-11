export type SourceOptions = {
  access_token: string;
  access_type: 'chat:write' | 'read';
};
export type QueryOptions = {
  operation: string;
  channel: string;
  message: string;
  sendAsUser: string;
  limit: string | number;
  cursor: string;
};
