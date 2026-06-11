export type SourceOptions = {
  account_sid: string;
  auth_token: string;
  messaging_service_sid: string;
};

export type QueryOptions = {
  operation: string;
  body: string;
  to_number: string;
};
