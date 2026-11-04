import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

function buildQueryString(query: Record<string, any>): string {
  const params = new URLSearchParams();

  const appendValue = (key: string, value: any): void => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      for (const item of value) appendValue(`${key}[]`, item);
      return;
    }

    if (typeof value === 'object') {
      for (const [childKey, childValue] of Object.entries(value)) {
        appendValue(`${key}[${childKey}]`, childValue);
      }
      return;
    }

    params.append(key, String(value));
  };

  for (const [key, value] of Object.entries(query)) {
    appendValue(key, value);
  }

  return params.toString();
}
export default class Directus implements QueryService {
  private getBaseUrl(instanceUrl?: string): string {
    if (!instanceUrl?.trim()) {
      throw new QueryError(
        'Invalid configuration',
        'Directus instance URL is required.',
        { code: 'MISSING_INSTANCE_URL' }
      );
    }

    const normalizedUrl = instanceUrl.trim().replace(/\/+$/, '');

    try {
      const url = new URL(normalizedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Unsupported URL protocol');
      }
      return normalizedUrl;
    } catch {
      throw new QueryError(
        'Invalid configuration',
        'Enter a valid Directus instance URL, including https://.',
        { code: 'INVALID_INSTANCE_URL' }
      );
    }
  }

  private getHeaders(accessToken?: string): Record<string, string> {
    if (!accessToken?.trim()) {
      throw new QueryError(
        'Invalid configuration',
        'Directus access token is required.',
        { code: 'MISSING_ACCESS_TOKEN' }
      );
    }

    return {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
    };
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string
  ): Promise<QueryResult> {
    const baseUrl = this.getBaseUrl(sourceOptions?.instanceUrl);
    const headers = this.getHeaders(sourceOptions?.accessToken);
    const method = queryOptions?.operation?.toUpperCase();
    const path = queryOptions?.path;

    if (!method || !path) {
      throw new QueryError(
        'Invalid configuration',
        'Select an operation before running the query.',
        { code: 'MISSING_OPERATION_DETAILS', dataSourceId }
      );
    }

    const { query = {}, path: pathParams = {}, request: body = {} } =
      queryOptions.params || {};

    let finalPath = path;

    for (const [key, value] of Object.entries(pathParams)) {
      finalPath = finalPath.replace(
        new RegExp(`{${key}}`, 'g'),
        encodeURIComponent(String(value))
      );
      finalPath = finalPath.replace(
        new RegExp(`:${key}`, 'g'),
        encodeURIComponent(String(value))
      );
    }

    const queryString = buildQueryString(query);

    const url = `${baseUrl}${finalPath}${
      queryString ? `?${queryString}` : ''
    }`;

    try {
      let requestHeaders: Record<string, string> = { ...headers };
      let requestBody: BodyInit | undefined;

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (method === 'POST' && finalPath.replace(/\/+$/, '') === '/files') {
          const fileValue = body['file'] as
            | { name?: string; type?: string; base64Data?: string }
            | string
            | undefined;

          if (!fileValue) {
            throw new QueryError(
              'Invalid upload',
              'Provide a file under the "file" request field.',
              { code: 'MISSING_FILE', dataSourceId }
            );
          }

          let fileName = 'upload.bin';
          let mimeType = 'application/octet-stream';
          let base64Data: string;

          if (typeof fileValue === 'string') {
            base64Data = fileValue;
          } else {
            fileName = fileValue.name || fileName;
            mimeType = fileValue.type || mimeType;
            base64Data = fileValue.base64Data || '';
          }

          const cleanedBase64 = base64Data.replace(
            /^data:[^;]+;base64,/,
            ''
          );

          if (!cleanedBase64) {
            throw new QueryError(
              'Invalid upload',
              'The file must include non-empty Base64 data.',
              { code: 'EMPTY_FILE_DATA', dataSourceId }
            );
          }

          const binary = atob(cleanedBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          const form = new FormData();
          form.append('file', new Blob([bytes], { type: mimeType }), fileName);

          for (const [key, value] of Object.entries(body)) {
            if (key !== 'file' && value !== undefined && value !== null) {
              form.append(
                key,
                typeof value === 'string' ? value : JSON.stringify(value)
              );
            }
          }

          requestBody = form;
          delete requestHeaders['Content-Type'];
        } else {
          requestBody = JSON.stringify(body);
        }
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
      });

      const responseText = await response.text();
      let result: unknown = {};

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = responseText;
        }
      }

      if (!response.ok) {
        const apiMessage =
          typeof result === 'object' && result !== null
            ? (result as any).errors?.[0]?.message ||
              (result as any).error ||
              (result as any).message
            : undefined;

        throw new QueryError(
          'Directus API request failed',
          apiMessage || `Directus returned HTTP ${response.status}.`,
          {
            code: 'DIRECTUS_API_ERROR',
            status: response.status,
            response: result,
          }
        );
      }

      return {
        status: 'ok',
        data: result as object | object[],
      };
    } catch (error: any) {
      if (error instanceof QueryError) {
        throw error;
      }

      throw new QueryError(
        'Directus API request failed',
        error?.message || 'Unable to reach the Directus instance.',
        {
          code: 'DIRECTUS_REQUEST_FAILED',
          name: error?.name,
        }
      );
    }
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    try {
      const baseUrl = this.getBaseUrl(sourceOptions?.instanceUrl);
      const headers = this.getHeaders(sourceOptions?.accessToken);

      const response = await fetch(`${baseUrl}/users/me`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return {
          status: 'failed',
          message:
            response.status === 401 || response.status === 403
              ? 'Authentication failed. Check your Directus access token and permissions.'
              : `Directus connection failed with HTTP ${response.status}.`,
        };
      }

      return {
        status: 'ok',
        message: 'Connection successful',
      };
    } catch (error: any) {
      if (error instanceof QueryError) {
        return {
          status: 'failed',
          message: error.message,
        };
      }

      return {
        status: 'failed',
        message: error?.message || 'Unable to connect to Directus.',
      };
    }
  }
}
