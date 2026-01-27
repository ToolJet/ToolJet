export type SourceOptions = {
  client_id?: string;
  client_secret?: string;
  customer_type?: CustomerType;
  child_key?: string;
  child_secret?: string;
  base_url?: BaseURL;
};

export enum CustomerType {
  STANDARD = "standard_customers",
  INTERNAL = "internal_customers",
  PROPRIETARY_PARENT_CHILD = "proprietary_parent_child_customers",
}

export enum BaseURL {
  PRODUCTION = "https://apis.fedex.com",
  SANDBOX = "https://apis-sandbox.fedex.com",
}

export type QueryOptions = {
  operation: string;
  path: string;
  params: {
    path?: Record<string, string>;
    query?: Record<string, string>;
    request?: Record<string, any>;
  };
  specType: string;
};