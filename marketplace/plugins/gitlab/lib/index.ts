import {
  ConnectionTestResult,
  OAuthUnauthorizedClientError,
  QueryError,
  QueryResult,
  QueryService,
} from '@tooljet-marketplace/common';

type Options = Record<string, unknown>;
type Token = { access_token?: string; refresh_token?: string; user_id?: string };
type SourceOptions = {
  base_url?: string;
  auth_type?: string;
  personal_token?: string;
  client_id?: string;
  client_secret?: string;
  scopes?: string;
  tj_redirect_host?: string;
  access_token?: string;
  refresh_token?: string;
  multiple_auth_enabled?: boolean;
  tokenData?: Token | Token[];
};
type Context = { user?: { id?: string }; app?: { isPublic?: boolean } };

const operations: Record<string, { method: string; path: string; required?: string[] }> = {
  list_projects: { method: 'GET', path: '/projects' },
  get_project: { method: 'GET', path: '/projects/:project_id' },
  list_issues: { method: 'GET', path: '/projects/:project_id/issues' },
  create_issue: { method: 'POST', path: '/projects/:project_id/issues', required: ['title'] },
  update_issue: { method: 'PUT', path: '/projects/:project_id/issues/:issue_iid' },
  list_merge_requests: { method: 'GET', path: '/projects/:project_id/merge_requests' },
  create_merge_request: {
    method: 'POST',
    path: '/projects/:project_id/merge_requests',
    required: ['source_branch', 'target_branch', 'title'],
  },
  merge_merge_request: { method: 'PUT', path: '/projects/:project_id/merge_requests/:merge_request_iid/merge' },
  list_branches: { method: 'GET', path: '/projects/:project_id/repository/branches' },
  get_file: { method: 'GET', path: '/projects/:project_id/repository/files/:file_path', required: ['ref'] },
  list_pipelines: { method: 'GET', path: '/projects/:project_id/pipelines' },
  trigger_pipeline: { method: 'POST', path: '/projects/:project_id/pipeline', required: ['ref'] },
  list_users: { method: 'GET', path: '/users' },
};

function jsonObject(value: unknown, field: string): Options {
  if (value === undefined || value === null || value === '') return {};
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new QueryError('Invalid input', `${field} must be a JSON object`, {});
  }
}

function required(options: Options, key: string): string {
  const value = options[key];
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new QueryError('Missing required input', `${key} is required`, {});
  }
  return String(value);
}

export default class Gitlab implements QueryService {
  private baseUrl(options: SourceOptions): string {
    const url = new URL(options.base_url || 'https://gitlab.com');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new QueryError(
        'Invalid base URL',
        'Use an HTTP(S) GitLab instance URL without credentials or query parameters',
        {}
      );
    }
    return url.toString().replace(/\/+$/, '');
  }

  private normalize(options: Options | { key: string; value: unknown }[]): SourceOptions {
    return Object.fromEntries(
      (Array.isArray(options) ? options.map(({ key, value }) => [key, value]) : Object.entries(options)).map(
        ([key, value]) => [key, value && typeof value === 'object' && 'value' in value ? value.value : value]
      )
    );
  }

  private redirectUri(options: SourceOptions): string {
    const host = required({ host: options.tj_redirect_host || process.env.TOOLJET_HOST }, 'host').replace(/\/+$/, '');
    const subpath = (process.env.SUB_PATH || '').replace(/^\/+|\/+$/g, '');
    return `${host}/${subpath ? `${subpath}/` : ''}oauth2/authorize`;
  }

  authUrl(sourceOptions: Options | { key: string; value: unknown }[]): string {
    const options = this.normalize(sourceOptions);
    const params = new URLSearchParams({
      client_id: required(options, 'client_id'),
      redirect_uri: this.redirectUri(options),
      response_type: 'code',
      scope: options.scopes || 'api',
    });
    return `${this.baseUrl(options)}/oauth/authorize?${params}`;
  }

  private token(options: SourceOptions, context?: Context): Token {
    if (options.multiple_auth_enabled) {
      const tokens = Array.isArray(options.tokenData) ? options.tokenData : [];
      return tokens.find((token) => token.user_id === context?.user?.id) || {};
    }
    const stored = !Array.isArray(options.tokenData) ? options.tokenData : undefined;
    return {
      access_token: options.access_token || stored?.access_token,
      refresh_token: options.refresh_token || stored?.refresh_token,
    };
  }

  private headers(options: SourceOptions, context?: Context): Record<string, string> {
    if (options.auth_type === 'oauth2') {
      return { Authorization: `Bearer ${required(this.token(options, context), 'access_token')}` };
    }
    return { 'PRIVATE-TOKEN': required(options, 'personal_token') };
  }

  private async request(url: string, init: RequestInit, oauth = false): Promise<Options | object[]> {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { Accept: 'application/json', ...init.headers },
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
      });
      const text = await response.text();
      let data: Options | object[];
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new QueryError(
          'GitLab request failed',
          `HTTP ${response.status}: GitLab returned a non-JSON response`,
          {}
        );
      }
      if (!response.ok) {
        const detail = !Array.isArray(data) && (data.message || data.error_description || data.error);
        const description = `HTTP ${response.status}: ${
          typeof detail === 'string' ? detail : JSON.stringify(detail || data)
        }`;
        const unauthorized =
          oauth && (response.status === 401 || (!Array.isArray(data) && data.error === 'invalid_grant'));
        const ErrorClass = unauthorized ? OAuthUnauthorizedClientError : QueryError;
        throw new ErrorClass('GitLab request failed', description, { statusCode: response.status });
      }
      return data;
    } catch (error) {
      if (error instanceof QueryError || error instanceof OAuthUnauthorizedClientError) throw error;
      throw new QueryError('GitLab request failed', error.message, {});
    }
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: Options,
    _dataSourceId?: string,
    _updatedAt?: string,
    context?: Context
  ): Promise<QueryResult> {
    // Older queries copied a form-style wrapper from the operation defaults.
    const selectedOperation = queryOptions.operation;
    const operationName =
      selectedOperation && typeof selectedOperation === 'object' && 'value' in selectedOperation
        ? selectedOperation.value
        : selectedOperation;
    const operation = operations[String(operationName)];
    if (!operation?.path) throw new QueryError('Invalid operation', 'Select a supported GitLab operation', {});
    if (sourceOptions.auth_type === 'oauth2' && !this.token(sourceOptions, context).access_token) {
      if (context?.app?.isPublic && !context?.user?.id) {
        throw new QueryError(
          'Missing access token',
          'Authorize the GitLab data source before running this public app',
          {}
        );
      }
      return { status: 'needs_oauth', data: { auth_url: this.authUrl(sourceOptions) } };
    }
    const path = operation.path.replace(/:([a-z_]+)/g, (_, key) => encodeURIComponent(required(queryOptions, key)));
    const url = new URL(`${this.baseUrl(sourceOptions)}/api/v4${path}`);
    const params = jsonObject(queryOptions.parameters, 'Parameters');
    const body = jsonObject(queryOptions.body, 'Body');
    for (const key of ['title', 'description', 'source_branch', 'target_branch', 'ref']) {
      if (queryOptions[key] !== undefined && queryOptions[key] !== '') {
        (operation.method === 'GET' ? params : body)[key] = queryOptions[key];
      }
    }
    for (const key of operation.required || []) required(operation.method === 'GET' ? params : body, key);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    const data = await this.request(
      url.toString(),
      {
        method: operation.method,
        headers: { ...this.headers(sourceOptions, context), 'Content-Type': 'application/json' },
        ...(operation.method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      },
      sourceOptions.auth_type === 'oauth2'
    );
    return { status: 'ok', data };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      await this.request(`${this.baseUrl(sourceOptions)}/api/v4/user`, { headers: this.headers(sourceOptions) });
      return { status: 'ok' };
    } catch (error) {
      return { status: 'failed', message: error.description || error.message };
    }
  }

  private async exchangeToken(options: SourceOptions, fields: Record<string, string>): Promise<Token> {
    const result = await this.request(
      `${this.baseUrl(options)}/oauth/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: required(options, 'client_id'),
          client_secret: required(options, 'client_secret'),
          redirect_uri: this.redirectUri(options),
          ...fields,
        }).toString(),
      },
      true
    );
    return {
      access_token: required(result as Options, 'access_token'),
      refresh_token: required(result as Options, 'refresh_token'),
    };
  }

  async accessDetailsFrom(
    code: string,
    sourceOptions: Options | { key: string; value: unknown }[],
    resetSecureData = false
  ): Promise<[string, string][]> {
    if (resetSecureData)
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    const token = await this.exchangeToken(this.normalize(sourceOptions), { grant_type: 'authorization_code', code });
    return [
      ['access_token', token.access_token],
      ['refresh_token', token.refresh_token],
    ];
  }

  async refreshToken(
    sourceOptions: SourceOptions,
    _dataSourceId?: string,
    userId?: string,
    _isAppPublic?: boolean
  ): Promise<Token> {
    return this.exchangeToken(sourceOptions, {
      grant_type: 'refresh_token',
      refresh_token: required(this.token(sourceOptions, { user: { id: userId } }), 'refresh_token'),
    });
  }
}
