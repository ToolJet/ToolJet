import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got, { HTTPError } from 'got';
import { SourceOptions, QueryOptions } from './types';

interface IntercomError {
  type: string;
  errors?: Array<{ code: string; message: string }>;
  message?: string;
}

export default class Intercom implements QueryService {
  private readonly BASE_URL = 'https://api.intercom.io';
  private readonly API_VERSION = '2.15';

  private buildHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Intercom-Version': this.API_VERSION,
      Accept: 'application/json',
    };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const accessToken = sourceOptions['access_token'];

    if (!accessToken || typeof accessToken !== 'string') {
      throw new QueryError(
        'Authentication required',
        'No access token found. Please provide a valid Intercom access token.',
        { code: 'MISSING_ACCESS_TOKEN' }
      );
    }

    const operation = queryOptions.operation?.toLowerCase?.();
    const path = queryOptions.path;
    const pathParams = queryOptions.params?.path ?? {};
    const queryParams = queryOptions.params?.query ?? {};
    const bodyParams = queryOptions.params?.request ?? {};

    // Build URL with path param interpolation
    let url = `${this.BASE_URL}${path}`;
    for (const [param, value] of Object.entries(pathParams)) {
      url = url.replace(`{${param}}`, encodeURIComponent(String(value)));
    }

    const requestOptions: Record<string, unknown> = {
      method: operation,
      headers: this.buildHeaders(accessToken),
      responseType: 'json',
    };

    // Add query params
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        requestOptions.searchParams = searchParams;
      }
    }

    // Add request body for non-GET/DELETE operations
    if (operation && !['get', 'delete'].includes(operation) && bodyParams && Object.keys(bodyParams).length > 0) {
      requestOptions.json = bodyParams;
    }

    try {
      const response = await got(url, requestOptions);
      return { status: 'ok', data: (response.body as unknown as Record<string, unknown>) ?? {} };
    } catch (error: unknown) {
      return this.handleError(error);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const accessToken = sourceOptions['access_token'];

    if (!accessToken || typeof accessToken !== 'string') {
      return { status: 'failed', message: 'Access token is required' };
    }

    try {
      await got(`${this.BASE_URL}/me`, {
        method: 'get',
        headers: this.buildHeaders(accessToken),
        responseType: 'json',
      });
      return { status: 'ok' };
    } catch (error: unknown) {
      const message = this.extractErrorMessage(error);
      return { status: 'failed', message };
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HTTPError) {
      const body = error.response?.body as IntercomError | undefined;

      if (body?.type === 'error.list' && Array.isArray(body?.errors) && body.errors.length > 0) {
        const firstError = body.errors[0];
        return `${firstError.code}: ${firstError.message}`;
      }

      if (body?.message) {
        return body.message;
      }

      return `HTTP ${error.response?.statusCode}: ${error.message}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unknown error occurred';
  }

  private handleError(error: unknown): never {
    const httpError = error instanceof HTTPError ? error : null;
    const statusCode = httpError?.response?.statusCode;
    const body = httpError?.response?.body as IntercomError | undefined;
    const message = this.extractErrorMessage(error);

    throw new QueryError('Query execution failed', message, {
      statusCode,
      errors: body?.errors,
      code: httpError?.code,
    });
  }
}
