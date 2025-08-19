export type App = {
  id: string;
  isPublic: boolean;
};

export type User = {
  id: string;
};

export type AuthSourceDetails = {
  baseUrl: string;
  authUrl: string;
  scope: string;
  accessTokenUrl: string;
  headerPrefix?: string;
  accessTokenCustomHeaders?: [string, string][];
};

export type ConvertedFormat = {
  method: string;
  headers: Record<string, string>;
  searchParams?: URLSearchParams;
  json?: Record<string, any>;
};
