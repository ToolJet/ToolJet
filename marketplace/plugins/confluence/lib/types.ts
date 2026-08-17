export interface SourceOptions {
  /** Always 'oauth2' — the plugin authenticates exclusively through Atlassian OAuth 2.0 (3LO). */
  auth_type?: 'oauth2';

  client_id?: string;
  client_secret?: string;
  scopes?: string;
  /**
   * Atlassian cloud id of the site this connection is pinned to, picked once on the datasource
   * form by the `getSites` selector. A 3LO token is not tied to a site — the site is addressed
   * in the URL — so one datasource means one site; connect a second datasource for a second site.
   */
  cloud_id?: string;
  auth_url?: string;
  access_token_url?: string;
  grant_type?: string;
  add_token_to?: string;
  header_prefix?: string;

  // Populated by ToolJet after the OAuth handshake
  access_token?: string;
  refresh_token?: string;
  tokenData?: any;
  multiple_auth_enabled?: boolean;
}

export interface QueryOptions {
  /** HTTP method, lowercased by the endpoint picker (get/post/put/delete/patch). */
  operation?: string;
  /** Templated path straight out of the spec, e.g. /pages/{id}. */
  path?: string;
  params?: {
    path?: Record<string, any>;
    query?: Record<string, any>;
    request?: Record<string, any>;
  };
  /** The spec's operation object, saved by the endpoint picker. */
  selectedOperation?: any;
}
