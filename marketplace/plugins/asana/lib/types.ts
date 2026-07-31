export type SourceOptions = {
  client_id: { value: string } | string;
  client_secret: { value: string } | string;
  access_token: string;
  refresh_token: string;
  oauth_type: { value: string } | string;
  multiple_auth_enabled?: boolean;
  tokenData?: Array<{ user_id: string; access_token: string; refresh_token: string; [key: string]: any }>;
};

export type QueryOptions = {
  resource: string;
  operation: string;

  // GID identifiers
  task_gid?: string;
  project_gid?: string;
  workspace_gid?: string;
  section_gid?: string;
  attachment_gid?: string;

  // Common GET params
  opt_fields?: string;
  limit?: string;
  offset?: string;

  // Task body (create/update)
  body?: string | Record<string, any>;

  // Comment
  text?: string;
  is_pinned?: string;

  // Followers
  followers?: string;

  // Duplicate task
  name?: string;
  include?: string;

  // Add to project
  insert_before?: string;
  insert_after?: string;

  // Tag
  color?: string;
};
