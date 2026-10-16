export type SourceOptions = {
  api_key: string;
};

/**
 * Query fields come from ToolJet's codehinter, so any of them can arrive as a string, the resolved
 * value of a `{{ }}` expression, or empty. `lib/index.ts` coerces each to the type the API expects.
 */
type Field = unknown;

export type QueryOptions = {
  operation: string;
  url?: Field;
  generate_json?: Field;
  country?: Field;
  use_browser?: Field;
  force_fresh?: Field;
  session_id?: Field;
  session_name?: Field;
  job_id?: Field;
  limit?: Field;
  depth?: Field;
  limit_per_level?: Field;
  include_subdomains?: Field;
  include_external_links?: Field;
  search?: Field;
  max_pages?: Field;
  include_patterns?: Field;
  exclude_patterns?: Field;
  prompt?: Field;
  schema?: Field;
  q?: Field;
  slug?: Field;
  action_id?: Field;
  params?: Field;
  credential_id?: Field;
  identity_id?: Field;
  catalog_id?: Field;
  catalog_slug?: Field;
  identity_name?: Field;
  source_id?: Field;
  source_ref?: Field;
  website_url?: Field;
  goal?: Field;
  visibility?: Field;
  force?: Field;
  actions?: Field;
  id?: Field;
  status?: Field;
  page?: Field;
  include_events?: Field;
  interval_minutes?: Field;
  scope?: Field;
  watch_mode?: Field;
  watch_format?: Field;
  output_schema?: Field;
  ai_mode?: Field;
  ai_goal?: Field;
  is_active?: Field;
  expires_at?: Field;
  alert_webhook_url?: Field;
  alert_emails?: Field;
  max_depth?: Field;
  wire_action_id?: Field;
  wire_catalog_slug?: Field;
  wire_credential_id?: Field;
  wire_params?: Field;
  wire_watch_paths?: Field;
  action?: Field;
  query?: Field;
  sources?: Field;
  search_id?: Field;
  domain?: Field;
  max_steps?: Field;
  timeout_ms?: Field;
};
