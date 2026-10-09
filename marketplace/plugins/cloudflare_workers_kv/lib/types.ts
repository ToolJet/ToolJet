export type SourceOptions = {
  account_id: string;
  api_token: string;
};

// Codehinter fields arrive as strings, or as already-resolved values when the user writes {{ }}.
type InputValue = string | number | boolean | object | null | undefined;

export type QueryOptions = {
  operation: Operation;
  namespace_id?: string;
  key_name?: string;
  title?: string;
  page?: InputValue;
  per_page?: InputValue;
  order?: string;
  direction?: string;
  prefix?: string;
  limit?: InputValue;
  cursor?: string;
  value?: InputValue;
  metadata?: InputValue;
  expiration?: InputValue;
  expiration_ttl?: InputValue;
  items?: InputValue;
  keys?: InputValue;
  value_type?: string;
  with_metadata?: string;
};

export enum Operation {
  ListNamespaces = 'list_namespaces',
  CreateNamespace = 'create_namespace',
  GetNamespace = 'get_namespace',
  RenameNamespace = 'rename_namespace',
  DeleteNamespace = 'delete_namespace',
  ListKeys = 'list_keys',
  ReadValue = 'read_value',
  ReadMetadata = 'read_metadata',
  WriteValue = 'write_value',
  DeleteKey = 'delete_key',
  BulkWrite = 'bulk_write',
  BulkRead = 'bulk_read',
  BulkDelete = 'bulk_delete',
}

export type CloudflareError = {
  code?: number;
  message?: string;
};

// Envelope returned by every JSON endpoint of the Cloudflare v4 API.
export type CloudflareResponse = {
  success?: boolean;
  errors?: CloudflareError[];
  messages?: unknown[];
  result?: unknown;
  result_info?: {
    count?: number;
    cursor?: string;
    page?: number;
    per_page?: number;
    total_count?: number;
  };
};
