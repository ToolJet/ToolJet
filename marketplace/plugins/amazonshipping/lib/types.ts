export type SourceOptions = {
  client_id: string;
  client_secret: string;
  authorization_code: string;
  redirect_uri: string;
  access_token: string;
};

export type QueryOptions = {
  operation: string;
  path: string;
  params?: {
    path?: Record<string, string>;        // e.g., { shipmentId: "XYZ" }
    query?: Record<string, string>;       // e.g., { marketplaceId: "ATVPD..." }
    request?: Record<string, any>;        // POST/PUT request body
  };
};
