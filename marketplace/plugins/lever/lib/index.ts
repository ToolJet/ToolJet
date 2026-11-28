import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got, { Got } from 'got';
import { SourceOptions, QueryOptions, Operation } from './types';
import { buildRequest } from './query_operations';

const BASE_URLS: Record<string, string> = {
  production: 'https://api.lever.co/v1/',
  sandbox: 'https://api.sandbox.lever.co/v1/',
};

const baseUrlFor = (environment: string | undefined): string => BASE_URLS[environment?.trim() || ''] ?? BASE_URLS.production;

/**
 * Lever (hire.lever.co) recruiting API v1.
 *
 * Auth is HTTP Basic with the API key as the username and an empty password, which got expresses
 * as the `username`/`password` pair. The sandbox environment is a fully separate deployment with
 * its own host and its own keys, so the base URL is chosen at connection time rather than being
 * an editable field.
 */
export default class Lever implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, _dataSourceId: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const operation: Operation = queryOptions.operation;

    let request;
    try {
      request = buildRequest(operation, queryOptions);
    } catch (error) {
      // Validation failures (missing id, bad JSON in a field) happen before any HTTP call.
      throw new QueryError('Query could not be completed', error?.message || 'Invalid operation or fields', {});
    }

    try {
      const response = await client(request.path, {
        method: request.method,
        searchParams: request.searchParams,
        ...(request.json !== undefined ? { json: request.json } : {}),
      });
      // Lever replies 204 with no body on some writes (e.g. adding tags).
      const body = response.body as string;
      return { status: 'ok', data: body ? JSON.parse(body) : {} };
    } catch (error) {
      // Lever's error envelope is { error: { code, message } }; surface it so the app builder sees
      // "Unauthorized" or "stage not found" instead of a bare status code.
      const status = error?.response?.statusCode ?? null;
      let message = error?.message || 'An unknown error occurred';
      try {
        const parsed = JSON.parse(error?.response?.body ?? '');
        message = parsed?.error?.message || parsed?.message || message;
      } catch {
        // Non-JSON error body; keep the HTTP error message.
      }
      throw new QueryError('Query could not be completed', message, { status });
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);
    try {
      // GET /users is available on every Lever API plan and requires a valid key, which makes it a
      // real credential check rather than a reachability check.
      await client('users', { searchParams: { limit: 1 } });
    } catch (error) {
      const status = error?.response?.statusCode ?? null;
      const message =
        status === 401 || status === 403
          ? 'Invalid API key, or the key does not belong to the selected environment.'
          : error?.message || 'Could not reach Lever';
      throw new QueryError('Connection test failed', message, { status });
    }
    return { status: 'ok' };
  }

  async getConnection(sourceOptions: SourceOptions): Promise<Got> {
    const apiKey = sourceOptions?.apiKey?.trim();
    if (!apiKey) {
      throw new QueryError('Invalid configuration', 'API key is required', { code: 'MISSING_API_KEY' });
    }
    return got.extend({
      prefixUrl: baseUrlFor(sourceOptions.environment),
      username: apiKey,
      password: '',
      responseType: 'text',
      // Lever rate-limits at 10 requests/second; one retry on 429 keeps bursty apps from surfacing
      // transient failures without hammering the API.
      retry: { limit: 1, statusCodes: [429] },
      headers: { Accept: 'application/json' },
    });
  }
}
