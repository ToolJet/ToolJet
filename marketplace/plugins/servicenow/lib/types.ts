export type AuthType = 'basic' | 'oauth2';

export interface SourceOptions {
  instance_url: string;
  auth_type: AuthType;
  // Basic auth
  username?: string;
  password?: string;
  // OAuth2 (authorization_code / standard flows)
  client_id?: string;
  client_secret?: string;
  // Action Fabric MCP server endpoint (absolute URL, or path appended to instance_url).
  // Blank → defaults to `${instance_url}/sncapps/mcp-server/mcp/sn_mcp_server_default`.
  mcp_endpoint?: string;
  // Scripted REST resource that runs subflows (for the trigger_flow op). Absolute URL,
  // or path appended to instance_url, e.g. `/api/<scope>/tooljet_flow/run`.
  flow_trigger_path?: string;
}

export type Operation =
  | 'list_tables'
  | 'get_table_schema'
  | 'get_field_choices'
  | 'list_records'
  | 'get_record'
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  | 'aggregate'
  | 'list_workflows'
  | 'invoke_workflow'
  | 'trigger_flow'
  | 'list_flows';

export type DisplayValue = 'true' | 'false' | 'all';

export interface QueryOptions {
  operation: Operation;
  table: string;
  sys_id?: string;
  name_filter?: string;
  field?: string;
  language?: string;
  body?: string | Record<string, unknown>;
  sysparm_query?: string;
  sysparm_limit?: string;
  sysparm_offset?: string;
  sysparm_fields?: string;
  sysparm_display_value?: DisplayValue;
  // aggregate / stats
  sysparm_count?: string;
  sysparm_group_by?: string;
  sysparm_avg?: string;
  sysparm_sum?: string;
  sysparm_min?: string;
  sysparm_max?: string;
  // Action Fabric (MCP) workflow invocation
  workflow?: string;
  arguments?: string | Record<string, unknown>;
  // Scripted REST flow trigger
  subflow?: string;
  inputs?: string | Record<string, unknown>;
}
