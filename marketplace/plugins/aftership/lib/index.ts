import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

export default class Aftership implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string
  ): Promise<QueryResult> {

    
    const specType = queryOptions?.specType?.toLowerCase();
    const apiKey = sourceOptions?.['as-api-key'];
    const method = queryOptions.operation?.toUpperCase();
    const path = queryOptions.path;
    const { query = {}, path: pathParams = {}, request: body = {} } = queryOptions.params || {};

    if (!apiKey || !method || !path) {
      throw new QueryError('Invalid configuration', 'Missing API key or selected operation details.', {
        missing: {
          apiKey: !apiKey,
          method: !method,
          path: !path,
        },
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'as-api-key': apiKey,
    };

    let baseUrl = '';
    switch (specType) {
      case 'shipping':
        baseUrl = 'https://sandbox-api.aftership.com/postmen/v3';
        break;
      case 'tracking':
        baseUrl = 'https://api.aftership.com/tracking/2024-07';
        break;
      case 'returns':
        baseUrl = 'https://api.aftership.com/returns/2025-07';
        break;
      default:
        throw new QueryError('Invalid Spec Type', `Unsupported specType: ${specType}`, {
          allowed: ['shipping', 'tracking', 'returns'],
        });
    }

    let finalPath = path;
    for (const [key, val] of Object.entries(pathParams)) {
      finalPath = finalPath.replace(`:${key}`, encodeURIComponent(val));
    }

    const queryString = new URLSearchParams(query as any).toString();
    const url = `${baseUrl}${finalPath}${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();


      return {
        status: 'ok',
        data: result,
      };
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      const errorDetails: any = {
        message: errorMessage,
        name: err?.name,
        code: err?.code,
        raw: err,
      };

      if (err?.response) {
        errorDetails.status = err.response.status;
        errorDetails.response = err.response.data;
      }

      throw new QueryError('API call error', errorMessage, errorDetails);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const apiKey = sourceOptions?.['as-api-key'];
    if (!apiKey) {
      return {
        status: 'failed',
        message: 'API key is required for connection testing.',
      };
    }

    try {
      const response = await fetch('https://sandbox-api.aftership.com/postmen/v3/rates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'as-api-key': apiKey,
        },
      });

      const result = await response.json();

      if (result?.meta?.code !== 200) {
        throw new QueryError(
          'Failed to verify connection',
          result?.meta?.message || 'Unexpected response during connection test',
          {
            message : result?.meta?.message || 'Unknown error',
            status: response.status,
            statusText: response.statusText,
            errorCode: result?.meta?.code,
            errorType: result?.meta?.type,
            raw: result,
          }
        );
      }

      return {
        status: 'ok',
        message: 'Connection successful',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      const errorDetails: any = {
        message: error?.message,
        name: error?.name,
        code: error?.code,
      };

      if (error?.response) {
        errorDetails.status = error.response.status;
        errorDetails.response = error.response.data;
      }
      throw new QueryError('Connection failed', errorMessage, errorDetails);
    }
  }
}
