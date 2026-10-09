import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got, { Method } from 'got';
import { SourceOptions, QueryOptions, Operation, CloudflareResponse } from './types';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';

type RequestOptions = {
  searchParams?: Record<string, string | number | undefined>;
  json?: unknown;
  body?: Buffer;
  contentType?: string;
};

export default class CloudflareWorkersKV implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const data = await this.runOperation(sourceOptions, queryOptions);
    return { status: 'ok', data };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    await this.requestJson(sourceOptions, 'GET', '', { searchParams: { per_page: 5 } });
    return { status: 'ok' };
  }

  private async runOperation(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<object> {
    const { operation } = queryOptions;

    switch (operation) {
      case Operation.ListNamespaces: {
        const response = await this.requestJson(sourceOptions, 'GET', '', {
          searchParams: {
            page: this.toNumber('Page', queryOptions.page),
            per_page: this.toNumber('Per page', queryOptions.per_page),
            order: queryOptions.order || undefined,
            direction: queryOptions.direction || undefined,
          },
        });
        return { namespaces: response.result, result_info: response.result_info };
      }

      case Operation.CreateNamespace: {
        const title = this.requireString('Title', queryOptions.title);
        const response = await this.requestJson(sourceOptions, 'POST', '', { json: { title } });
        return response.result as object;
      }

      case Operation.GetNamespace: {
        const response = await this.requestJson(sourceOptions, 'GET', this.namespacePath(queryOptions));
        return response.result as object;
      }

      case Operation.RenameNamespace: {
        const title = this.requireString('New title', queryOptions.title);
        const response = await this.requestJson(sourceOptions, 'PUT', this.namespacePath(queryOptions), {
          json: { title },
        });
        return (response.result as object) ?? { success: true };
      }

      case Operation.DeleteNamespace: {
        await this.requestJson(sourceOptions, 'DELETE', this.namespacePath(queryOptions));
        return { success: true };
      }

      case Operation.ListKeys: {
        const response = await this.requestJson(sourceOptions, 'GET', `${this.namespacePath(queryOptions)}/keys`, {
          searchParams: {
            prefix: queryOptions.prefix || undefined,
            limit: this.toNumber('Limit', queryOptions.limit),
            cursor: queryOptions.cursor || undefined,
          },
        });
        return {
          keys: response.result,
          // Empty when there are no more pages; pass it back as `cursor` to get the next page.
          cursor: response.result_info?.cursor || null,
          count: response.result_info?.count,
        };
      }

      case Operation.ReadValue: {
        const keyName = this.requireKeyName(queryOptions);
        // This endpoint returns the raw stored value, not the JSON envelope.
        const value = await this.request(
          sourceOptions,
          'GET',
          `${this.namespacePath(queryOptions)}/values/${encodeURIComponent(keyName)}`
        );
        return { key: keyName, value };
      }

      case Operation.ReadMetadata: {
        const keyName = this.requireKeyName(queryOptions);
        const response = await this.requestJson(
          sourceOptions,
          'GET',
          `${this.namespacePath(queryOptions)}/metadata/${encodeURIComponent(keyName)}`
        );
        return { key: keyName, metadata: response.result ?? null };
      }

      case Operation.WriteValue: {
        const keyName = this.requireKeyName(queryOptions);
        if (queryOptions.value === undefined || queryOptions.value === null) {
          throw new QueryError('Query could not be completed', 'Value is required', {});
        }

        const form = new FormData();
        form.append(
          'value',
          typeof queryOptions.value === 'string' ? queryOptions.value : JSON.stringify(queryOptions.value)
        );
        const metadata = this.parseJson('Metadata', queryOptions.metadata);
        if (metadata !== undefined) {
          form.append('metadata', JSON.stringify(metadata));
        }

        // Let Node encode the multipart body (and its boundary) so got can send it as a Buffer.
        const encoded = new Request('http://localhost', { method: 'PUT', body: form });

        await this.requestJson(
          sourceOptions,
          'PUT',
          `${this.namespacePath(queryOptions)}/values/${encodeURIComponent(keyName)}`,
          {
            body: Buffer.from(await encoded.arrayBuffer()),
            contentType: encoded.headers.get('content-type'),
            searchParams: {
              expiration: this.toNumber('Expiration', queryOptions.expiration),
              expiration_ttl: this.toNumber('Expiration TTL', queryOptions.expiration_ttl),
            },
          }
        );
        return { success: true, key: keyName };
      }

      case Operation.DeleteKey: {
        const keyName = this.requireKeyName(queryOptions);
        await this.requestJson(
          sourceOptions,
          'DELETE',
          `${this.namespacePath(queryOptions)}/values/${encodeURIComponent(keyName)}`
        );
        return { success: true, key: keyName };
      }

      case Operation.BulkWrite: {
        const items = this.requireArray('Key-value pairs', queryOptions.items);
        const response = await this.requestJson(sourceOptions, 'PUT', `${this.namespacePath(queryOptions)}/bulk`, {
          json: items,
        });
        return (response.result as object) ?? { success: true };
      }

      case Operation.BulkRead: {
        const keys = this.requireArray('Keys', queryOptions.keys);
        const response = await this.requestJson(sourceOptions, 'POST', `${this.namespacePath(queryOptions)}/bulk/get`, {
          json: {
            keys,
            type: queryOptions.type || 'text',
            withMetadata: queryOptions.with_metadata === 'true',
          },
        });
        return response.result as object;
      }

      case Operation.BulkDelete: {
        const keys = this.requireArray('Keys', queryOptions.keys);
        const response = await this.requestJson(
          sourceOptions,
          'POST',
          `${this.namespacePath(queryOptions)}/bulk/delete`,
          {
            json: keys,
          }
        );
        return (response.result as object) ?? { success: true };
      }

      default:
        throw new QueryError('Query could not be completed', `Unknown operation: ${operation}`, {});
    }
  }

  private namespacePath(queryOptions: QueryOptions): string {
    return `/${encodeURIComponent(this.requireString('Namespace ID', queryOptions.namespace_id))}`;
  }

  // Sends a request under /accounts/{account_id}/storage/kv/namespaces and returns the raw body.
  private async request(
    sourceOptions: SourceOptions,
    method: Method,
    path: string,
    options: RequestOptions = {}
  ): Promise<string> {
    const accountId = sourceOptions.account_id?.trim();
    const apiToken = sourceOptions.api_token?.trim();
    if (!accountId || !apiToken) {
      throw new QueryError('Missing connection details', 'Account ID and API token are required', {});
    }

    const searchParams: Record<string, string | number> = {};
    for (const name of Object.keys(options.searchParams ?? {})) {
      const value = options.searchParams[name];
      if (value !== undefined && value !== '') searchParams[name] = value;
    }

    let response;
    try {
      response = await got(`${API_BASE_URL}/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${apiToken}`,
          ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
        },
        searchParams,
        ...(options.json !== undefined ? { json: options.json } : {}),
        ...(options.body !== undefined ? { body: options.body } : {}),
        throwHttpErrors: false,
        retry: { limit: 0 },
      });
    } catch (error) {
      throw new QueryError(
        'Could not reach the Cloudflare API',
        error instanceof Error ? error.message : String(error),
        {}
      );
    }

    if (response.statusCode >= 400) {
      const body = this.tryParse(response.body);
      throw new QueryError('Query could not be completed', this.describeError(body, response.statusCode), {
        status: response.statusCode,
        body,
      });
    }

    return response.body;
  }

  private async requestJson(
    sourceOptions: SourceOptions,
    method: Method,
    path: string,
    options: RequestOptions = {}
  ): Promise<CloudflareResponse> {
    const body = this.tryParse(await this.request(sourceOptions, method, path, options));
    if (typeof body !== 'object' || body === null) {
      throw new QueryError('Query could not be completed', 'Unexpected response from the Cloudflare API', { body });
    }

    const response = body as CloudflareResponse;
    if (response.success === false) {
      throw new QueryError('Query could not be completed', this.describeError(response), { body: response });
    }
    return response;
  }

  // Turns Cloudflare's `errors: [{ code, message }]` into a readable message.
  private describeError(body: unknown, statusCode?: number): string {
    const errors = (body as CloudflareResponse)?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors.map((error) => (error.code ? `${error.message} (code ${error.code})` : error.message)).join('; ');
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return statusCode ? `Cloudflare API returned HTTP ${statusCode}` : 'Cloudflare API request failed';
  }

  private tryParse(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // Key names are used verbatim: KV treats leading/trailing whitespace as part of the key.
  private requireKeyName(queryOptions: QueryOptions): string {
    const keyName =
      queryOptions.key_name === undefined || queryOptions.key_name === null ? '' : String(queryOptions.key_name);
    if (!keyName) {
      throw new QueryError('Query could not be completed', 'Key is required', {});
    }
    return keyName;
  }

  private requireString(field: string, value: unknown): string {
    const text = typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value);
    if (!text) {
      throw new QueryError('Query could not be completed', `${field} is required`, {});
    }
    return text;
  }

  private toNumber(field: string, value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const number = Number(value);
    if (Number.isNaN(number)) {
      throw new QueryError('Query could not be completed', `${field} must be a number`, {});
    }
    return number;
  }

  private parseJson(field: string, value: unknown): unknown {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new QueryError('Query could not be completed', `${field} must be valid JSON`, {});
    }
  }

  private requireArray(field: string, value: unknown): unknown[] {
    const parsed = this.parseJson(field, value);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new QueryError('Query could not be completed', `${field} must be a non-empty JSON array`, {});
    }
    return parsed;
  }
}
