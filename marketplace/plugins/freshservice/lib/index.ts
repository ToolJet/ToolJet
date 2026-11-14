import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got, { OptionsOfJSONResponseBody, HTTPError } from 'got';
import { SourceOptions, QueryOptions } from './types';

export default class Freshservice implements QueryService {
  /**
   * Normalise the domain: strip protocol and trailing slash so callers
   * can type "https://acme.freshservice.com/" or "acme.freshservice.com".
   */
  private baseUrl(sourceOptions: SourceOptions): string {
    const domain = (sourceOptions.domain || '')
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');
    return `https://${domain}/api/v2`;
  }

  /**
   * Build the Authorization header from the API key.
   * Freshservice uses HTTP Basic auth where the API key is the username and
   * the password is literally "X".
   */
  private authHeader(sourceOptions: SourceOptions): string {
    const credentials = Buffer.from(`${sourceOptions.api_key}:X`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Parse a body that may arrive as a JSON string or a plain object.
   */
  private parseBody(body: QueryOptions['body']): Record<string, unknown> {
    if (body === undefined || body === null || body === '') return {};
    if (typeof body === 'object') return body as Record<string, unknown>;
    try {
      return JSON.parse(body);
    } catch {
      throw new QueryError('Invalid JSON body', 'The body field must be a valid JSON object.', {});
    }
  }

  /**
   * Shared request helper — builds the got options, executes the request and
   * unwraps Freshservice rate-limit / error responses into clear QueryErrors.
   */
  private async request(
    sourceOptions: SourceOptions,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    searchParams?: Record<string, string>,
    json?: Record<string, unknown>
  ): Promise<any> {
    const url = `${this.baseUrl(sourceOptions)}${path}`;

    const options: OptionsOfJSONResponseBody = {
      method,
      headers: {
        Authorization: this.authHeader(sourceOptions),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      responseType: 'json',
      throwHttpErrors: false, // handle errors manually for cleaner messages
      ...(searchParams && Object.keys(searchParams).length > 0 ? { searchParams } : {}),
      ...(json !== undefined ? { json } : {}),
    };

    const response = await got(url, options);
    const body = response.body as any;
    const status = response.statusCode;

    // Handle rate limiting (429)
    if (status === 429) {
      const retryAfter = response.headers['retry-after'] || 'a moment';
      throw new QueryError(
        'Freshservice rate limit reached',
        `Too many requests. Please retry after ${retryAfter} seconds.`,
        { statusCode: status }
      );
    }

    // Handle auth errors
    if (status === 401) {
      throw new QueryError(
        'Freshservice authentication failed',
        'Invalid API key or domain. Check your credentials.',
        { statusCode: status }
      );
    }

    // Handle not found
    if (status === 404) {
      throw new QueryError(
        'Freshservice resource not found',
        body?.description || 'The requested resource could not be found.',
        { statusCode: status }
      );
    }

    // Handle other 4xx / 5xx errors
    if (status >= 400) {
      const message =
        body?.description ||
        (Array.isArray(body?.errors) ? body.errors.map((e: any) => e.message).join('; ') : null) ||
        `HTTP ${status}`;
      throw new QueryError('Freshservice API error', message, { statusCode: status, body });
    }

    return body;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation } = queryOptions;

    // Pagination helpers
    const page = queryOptions.page ? String(queryOptions.page) : undefined;
    const per_page = queryOptions.per_page ? String(queryOptions.per_page) : undefined;
    const paginationParams: Record<string, string> = {};
    if (page) paginationParams['page'] = page;
    if (per_page) paginationParams['per_page'] = per_page;

    try {
      let data: any;

      switch (operation) {
        // ───────────── Tickets ─────────────
        case 'list_tickets': {
          const result = await this.request(sourceOptions, 'GET', '/tickets', paginationParams);
          data = result?.tickets ?? result;
          break;
        }

        case 'get_ticket': {
          if (!queryOptions.ticket_id) {
            throw new QueryError('Missing required field', 'ticket_id is required for get_ticket.', {});
          }
          const result = await this.request(sourceOptions, 'GET', `/tickets/${queryOptions.ticket_id}`);
          data = result?.ticket ?? result;
          break;
        }

        case 'create_ticket': {
          const body = this.parseBody(queryOptions.body);
          const result = await this.request(sourceOptions, 'POST', '/tickets', undefined, body);
          data = result?.ticket ?? result;
          break;
        }

        case 'update_ticket': {
          if (!queryOptions.ticket_id) {
            throw new QueryError('Missing required field', 'ticket_id is required for update_ticket.', {});
          }
          const body = this.parseBody(queryOptions.body);
          const result = await this.request(sourceOptions, 'PUT', `/tickets/${queryOptions.ticket_id}`, undefined, body);
          data = result?.ticket ?? result;
          break;
        }

        case 'delete_ticket': {
          if (!queryOptions.ticket_id) {
            throw new QueryError('Missing required field', 'ticket_id is required for delete_ticket.', {});
          }
          await this.request(sourceOptions, 'DELETE', `/tickets/${queryOptions.ticket_id}`);
          data = { success: true, message: `Ticket ${queryOptions.ticket_id} deleted successfully.` };
          break;
        }

        case 'add_note_to_ticket': {
          if (!queryOptions.ticket_id) {
            throw new QueryError('Missing required field', 'ticket_id is required for add_note_to_ticket.', {});
          }
          const isPrivate = queryOptions.note_private !== 'false';
          const noteBody: Record<string, unknown> = {
            body: queryOptions.note_body || '',
            private: isPrivate,
          };
          const result = await this.request(
            sourceOptions,
            'POST',
            `/tickets/${queryOptions.ticket_id}/notes`,
            undefined,
            noteBody
          );
          data = result?.note ?? result;
          break;
        }

        case 'reply_to_ticket': {
          if (!queryOptions.ticket_id) {
            throw new QueryError('Missing required field', 'ticket_id is required for reply_to_ticket.', {});
          }
          const replyBody: Record<string, unknown> = {
            body: queryOptions.reply_body || '',
          };
          const result = await this.request(
            sourceOptions,
            'POST',
            `/tickets/${queryOptions.ticket_id}/reply`,
            undefined,
            replyBody
          );
          data = result?.conversation ?? result;
          break;
        }

        // ───────────── Requesters ─────────────
        case 'list_requesters': {
          const result = await this.request(sourceOptions, 'GET', '/requesters', paginationParams);
          data = result?.requesters ?? result;
          break;
        }

        // ───────────── Agents ─────────────
        case 'list_agents': {
          const result = await this.request(sourceOptions, 'GET', '/agents', paginationParams);
          data = result?.agents ?? result;
          break;
        }

        // ───────────── Assets ─────────────
        case 'list_assets': {
          const result = await this.request(sourceOptions, 'GET', '/assets', paginationParams);
          data = result?.assets ?? result;
          break;
        }

        case 'create_asset': {
          const body = this.parseBody(queryOptions.body);
          const result = await this.request(sourceOptions, 'POST', '/assets', undefined, body);
          data = result?.asset ?? result;
          break;
        }

        // ───────────── Changes ─────────────
        case 'list_changes': {
          const result = await this.request(sourceOptions, 'GET', '/changes', paginationParams);
          data = result?.changes ?? result;
          break;
        }

        // ───────────── Problems ─────────────
        case 'list_problems': {
          const result = await this.request(sourceOptions, 'GET', '/problems', paginationParams);
          data = result?.problems ?? result;
          break;
        }

        // ───────────── Service Catalog ─────────────
        case 'list_service_catalog_items': {
          const result = await this.request(sourceOptions, 'GET', '/service_catalog/items', paginationParams);
          data = result?.service_items ?? result;
          break;
        }

        default: {
          throw new QueryError('Unsupported operation', `The operation "${operation}" is not supported.`, {});
        }
      }

      return { status: 'ok', data };
    } catch (error) {
      if (error instanceof QueryError) throw error;
      const message = error?.response?.body?.description || error?.message || String(error);
      throw new QueryError('Query could not be completed', message, error?.response?.body ?? {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      // A lightweight call: list tickets with page size of 1
      await this.request(sourceOptions, 'GET', '/tickets', { per_page: '1', page: '1' });
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'failed',
        message: error instanceof QueryError ? error.message : (error?.message ?? String(error)),
      };
    }
  }
}
