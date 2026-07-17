import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  OAuthUnauthorizedClientError,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import got from 'got';

const ASANA_BASE_URL = 'https://app.asana.com/api/1.0';
const ASANA_AUTH_URL = 'https://app.asana.com/-/oauth_authorize';
const ASANA_TOKEN_URL = 'https://app.asana.com/-/oauth_token';

export default class Asana implements QueryService {
  authUrl(source_options: SourceOptions): string {
    const { clientId, redirectUri } = this.getOAuthCredentials(source_options);

    if (!clientId) {
      throw new Error('Asana OAuth client_id is missing');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
    });

    return `${ASANA_AUTH_URL}?${params.toString()}`;
  }

  async accessDetailsFrom(authCode: string, source_options: SourceOptions, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const { clientId, clientSecret, redirectUri } = this.getOAuthCredentials(source_options);

    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: authCode,
    });

    try {
      const response = await got(ASANA_TOKEN_URL, {
        method: 'post',
        body: data.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      const authDetails: [string, string][] = [];

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }
      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
      if (result['expires_in']) {
        authDetails.push(['expires_in', result['expires_in'].toString()]);
      }
      if (result['token_type']) {
        authDetails.push(['token_type', result['token_type']]);
      }

      return authDetails;
    } catch (error) {
      throw new QueryError(
        'Authorization Error',
        error.response?.body || error.message,
        { error: error.message }
      );
    }
  }

  async refreshToken(
    sourceOptions: SourceOptions,
    _dataSourceId?: string,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<{ access_token: string; refresh_token?: string }> {
    let refreshToken: string;
    if (sourceOptions.multiple_auth_enabled) {
      const currentToken = sourceOptions.tokenData?.find((t) =>
        isAppPublic && !userId ? true : t.user_id === userId
      );
      refreshToken = currentToken?.refresh_token;
    } else {
      refreshToken = sourceOptions.refresh_token;
    }

    if (!refreshToken) {
      throw new QueryError('Refresh token not found', 'Refresh token is required to refresh the access token', {});
    }

    const { clientId, clientSecret } = this.getOAuthCredentials(sourceOptions);

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    try {
      const response = await got(ASANA_TOKEN_URL, {
        method: 'post',
        body: data.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const result = JSON.parse(response.body);

      if (!result['access_token']) {
        throw new QueryError('Refresh token failed', 'Access token not found in response', {});
      }

      return {
        access_token: result['access_token'],
        ...(result['refresh_token'] ? { refresh_token: result['refresh_token'] } : {}),
      };
    } catch (error) {
      if (error instanceof QueryError) throw error;
      throw new QueryError(
        'Error refreshing access token',
        error.response?.body || error.message,
        {}
      );
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const response = await got(`${ASANA_BASE_URL}/users/me`, {
        headers: this.authHeader(sourceOptions.access_token),
      });
      const data = JSON.parse(response.body);
      if (data?.data?.gid) {
        return { status: 'ok' };
      }
      throw new Error('Unexpected response from Asana');
    } catch (error) {
      throw new QueryError(
        'Connection could not be established',
        error.response?.body || error.message,
        {}
      );
    }
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId?: string,
    _updatedAt?: string,
    context?: { user?: { id?: string }; app?: any }
  ): Promise<QueryResult> {
    let token: string;
    if (sourceOptions.multiple_auth_enabled) {
      const userId = context?.user?.id;
      const currentToken = sourceOptions.tokenData?.find((t) =>
        userId ? t.user_id === userId : true
      );
      if (!currentToken) {
        return { status: 'needs_oauth', data: { auth_url: this.authUrl(sourceOptions) } } as any;
      }
      token = currentToken.access_token;
    } else {
      token = sourceOptions.access_token;
    }
    const { resource } = queryOptions;

    let result: any;

    try {
      switch (resource) {
        case 'task':
          result = await this.handleTask(token, queryOptions);
          break;
        case 'project':
          result = await this.handleProject(token, queryOptions);
          break;
        case 'workspace':
          result = await this.handleWorkspace(token, queryOptions);
          break;
        case 'attachment':
          result = await this.handleAttachment(token, queryOptions);
          break;
        default:
          throw new QueryError('Unknown resource', `Resource "${resource}" is not supported`, {});
      }
    } catch (error) {
      if (error instanceof QueryError) throw error;
      if (error.response?.statusCode === 401) {
        throw new OAuthUnauthorizedClientError('Unauthorized', error.message, {});
      }
      const body = this.parseErrorBody(error);
      throw new QueryError('Query could not be completed', body?.errors?.[0]?.message || error.message, body);
    }

    return { status: 'ok', data: result };
  }

  // ─── Task handlers ───────────────────────────────────────────────────────────

  private async handleTask(token: string, opts: QueryOptions): Promise<any> {
    const { operation } = opts;

    switch (operation) {
      case 'list_tasks':
        return this.get(token, '/tasks', this.clean({
          project: opts.project_gid,
          opt_fields: opts.opt_fields,
          limit: opts.limit,
          offset: opts.offset,
        }));

      case 'get_task':
        return this.get(token, `/tasks/${opts.task_gid}`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'create_task': {
        const body = this.parseBody(opts.body);
        if (opts.workspace_gid) body['workspace'] = opts.workspace_gid;
        return this.post(token, '/tasks', body);
      }

      case 'update_task':
        return this.put(token, `/tasks/${opts.task_gid}`, this.parseBody(opts.body));

      case 'delete_task':
        return this.delete(token, `/tasks/${opts.task_gid}`);

      case 'add_comment':
        return this.post(token, `/tasks/${opts.task_gid}/stories`, {
          text: opts.text || '',
          is_pinned: opts.is_pinned === 'true',
        });

      case 'list_stories':
        return this.get(token, `/tasks/${opts.task_gid}/stories`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'list_subtasks':
        return this.get(token, `/tasks/${opts.task_gid}/subtasks`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'create_subtask': {
        const body = this.parseBody(opts.body);
        return this.post(token, `/tasks/${opts.task_gid}/subtasks`, body);
      }

      case 'add_to_project':
        return this.post(token, `/tasks/${opts.task_gid}/addProject`, this.clean({
          project: opts.project_gid,
          section: opts.section_gid,
        }));

      case 'remove_from_project':
        return this.post(token, `/tasks/${opts.task_gid}/removeProject`, {
          project: opts.project_gid,
        });

      case 'add_followers':
        return this.post(token, `/tasks/${opts.task_gid}/addFollowers`, {
          followers: this.parseGidList(opts.followers),
        });

      case 'remove_followers':
        return this.post(token, `/tasks/${opts.task_gid}/removeFollowers`, {
          followers: this.parseGidList(opts.followers),
        });

      case 'duplicate_task':
        return this.post(token, `/tasks/${opts.task_gid}/duplicate`, this.clean({
          name: opts.name,
          include: opts.include ? opts.include.split(',').map((s) => s.trim()) : undefined,
        }));

      case 'list_attachments':
        return this.get(token, `/tasks/${opts.task_gid}/attachments`, {});

      default:
        throw new QueryError('Unknown operation', `Task operation "${operation}" is not supported`, {});
    }
  }

  // ─── Project handlers ─────────────────────────────────────────────────────────

  private async handleProject(token: string, opts: QueryOptions): Promise<any> {
    const { operation } = opts;

    switch (operation) {
      case 'list_projects':
        return this.get(token, '/projects', this.clean({
          workspace: opts.workspace_gid,
          opt_fields: opts.opt_fields,
          limit: opts.limit,
          offset: opts.offset,
        }));

      case 'get_project':
        return this.get(token, `/projects/${opts.project_gid}`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'create_project': {
        const body = this.parseBody(opts.body);
        if (opts.workspace_gid) body['workspace'] = opts.workspace_gid;
        return this.post(token, '/projects', body);
      }

      case 'update_project':
        return this.put(token, `/projects/${opts.project_gid}`, this.parseBody(opts.body));

      case 'delete_project':
        return this.delete(token, `/projects/${opts.project_gid}`);

      case 'list_sections':
        return this.get(token, `/projects/${opts.project_gid}/sections`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      default:
        throw new QueryError('Unknown operation', `Project operation "${operation}" is not supported`, {});
    }
  }

  // ─── Workspace handlers ───────────────────────────────────────────────────────

  private async handleWorkspace(token: string, opts: QueryOptions): Promise<any> {
    const { operation } = opts;

    switch (operation) {
      case 'list_workspaces':
        return this.get(token, '/workspaces', this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'list_users':
        return this.get(token, `/workspaces/${opts.workspace_gid}/users`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'list_teams':
        return this.get(token, `/workspaces/${opts.workspace_gid}/teams`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'list_tags':
        return this.get(token, `/workspaces/${opts.workspace_gid}/tags`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'create_tag':
        return this.post(token, '/tags', this.clean({
          name: opts.name,
          color: opts.color,
          workspace: opts.workspace_gid,
        }));

      default:
        throw new QueryError('Unknown operation', `Workspace operation "${operation}" is not supported`, {});
    }
  }

  // ─── Attachment handlers ──────────────────────────────────────────────────────

  private async handleAttachment(token: string, opts: QueryOptions): Promise<any> {
    const { operation } = opts;

    switch (operation) {
      case 'get_attachment':
        return this.get(token, `/attachments/${opts.attachment_gid}`, this.clean({
          opt_fields: opts.opt_fields,
        }));

      case 'delete_attachment':
        return this.delete(token, `/attachments/${opts.attachment_gid}`);

      default:
        throw new QueryError('Unknown operation', `Attachment operation "${operation}" is not supported`, {});
    }
  }

  // ─── HTTP helpers ─────────────────────────────────────────────────────────────

  private async get(token: string, path: string, searchParams: Record<string, any>): Promise<any> {
    const response = await got(`${ASANA_BASE_URL}${path}`, {
      method: 'GET',
      headers: this.authHeader(token),
      searchParams,
    });
    return JSON.parse(response.body);
  }

  private async post(token: string, path: string, data: Record<string, any>): Promise<any> {
    const response = await got(`${ASANA_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.authHeader(token),
      json: { data },
    });
    return JSON.parse(response.body);
  }

  private async put(token: string, path: string, data: Record<string, any>): Promise<any> {
    const response = await got(`${ASANA_BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.authHeader(token),
      json: { data },
    });
    return JSON.parse(response.body);
  }

  private async delete(token: string, path: string): Promise<any> {
    const response = await got(`${ASANA_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.authHeader(token),
    });
    if (!response.body) return { data: {} };
    return JSON.parse(response.body);
  }

  // ─── Utility helpers ──────────────────────────────────────────────────────────

  private authHeader(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private parseBody(body: string | Record<string, any> | undefined): Record<string, any> {
    if (!body) return {};
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return {};
      }
    }
    return body;
  }

  private parseGidList(value: string | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  private clean(params: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
  }

  private parseErrorBody(error: any): any {
    if (!error.response?.body) return {};
    try {
      return JSON.parse(error.response.body);
    } catch {
      return { raw: error.response.body };
    }
  }

  private normalizeSourceOptions(source_options: any): Record<string, any> {
    if (!Array.isArray(source_options)) return source_options;
    const normalized: Record<string, any> = {};
    source_options.forEach((item: any) => {
      normalized[item.key] = item.value;
    });
    return normalized;
  }

  private getOptionValue(option: any): any {
    if (option?.value !== undefined) return option.value;
    return option;
  }

  private getOAuthCredentials(source_options: SourceOptions) {
    const options = this.normalizeSourceOptions(source_options);

    const clientId = this.getOptionValue(options.client_id) as string;
    const clientSecret = this.getOptionValue(options.client_secret) as string;

    const host = process.env.TOOLJET_HOST || '';
    const subpath = process.env.SUB_PATH || '';
    const fullUrl = `${host}${subpath || '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    return { clientId, clientSecret, redirectUri };
  }
}
