export type SourceOptions = {
  client_id?: string;
  client_secret?: string;
  shipper_number?: string;
  environment?: Environment;
};

export enum Environment {
  PRODUCTION = "production",
  CIE = "cie", // Customer Integration Environment
}

export enum SpecType {
  SHIPPING = "shipping",
  RATING = "rating",
  TRACKING = "tracking",
  ADDRESS_VALIDATION = "address__validation",
  TIME_IN_TRANSIT = "time__in__transit",
  PICKUP = "pickup",
  PAPERLESS_INVOICE = "paperless__invoice",
}

export type QueryOptions = {
  transformationLanguage: string;
  enableTransformation: boolean;
  operation: string; // HTTP method: 'get', 'post', etc.
  path: string;
  selectedOperation: OpenAPIOperation;
  params: {
    path: Record<string, string>;
    query: Record<string, string>;
    request?: Record<string, any>;
  };
  specType?: SpecType;
};

export type OpenAPIOperation = {
  summary: string;
  tags: string[];
  security?: Record<string, unknown>[];
  description?: string;
  operationId?: string;
  parameters?: unknown[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, any>;
  };
  responses?: Record<string, any>;
};
