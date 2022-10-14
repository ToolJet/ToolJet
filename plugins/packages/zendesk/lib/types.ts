export type SourceOptions = {
  clientId: string;
  clientSecret: string;
  subdomain: string;
  scope: string;
  accessToken?: string;
  refreshToken?: string;
};
export type QueryOptions = {
  operation: string;
};
