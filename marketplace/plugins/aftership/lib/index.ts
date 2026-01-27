import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

export default class Aftership implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const specType = queryOptions?.specType?.toLowerCase();
    const apiKey = sourceOptions?.['apiKey'];
    const method = queryOptions.operation?.toUpperCase();
    const path = queryOptions.path;
    const { query = {}, path: pathParams = {}, request: body = {} } = queryOptions.params || {};

    if (!apiKey || !method || !path) {
      const errorMessage = 'Missing API key or selected operation details.';
      const errorDetails = {
        message: errorMessage,
        name: 'InvalidConfigurationError',
        code: 'MISSING_FIELDS',
        missing: {
          apiKey: !apiKey,
          method: !method,
          path: !path,
        },
      };
      throw new QueryError('Invalid configuration', errorMessage, errorDetails);
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
      default: {
        const errorMessage = `Unsupported specType: ${specType}`;
        const errorDetails = {
          message: errorMessage,
          name: 'InvalidSpecTypeError',
          code: 'INVALID_SPEC_TYPE',
          raw: specType,
          allowed: ['shipping', 'tracking', 'returns'],
        };
        throw new QueryError('Invalid Spec Type', errorMessage, errorDetails);
      }
    }

    let finalPath = path;
    for (const [key, val] of Object.entries(pathParams)) {
      const encodedVal = encodeURIComponent(val);
      finalPath = finalPath.replace(new RegExp(`{${key}}`, 'g'), encodedVal);
      finalPath = finalPath.replace(new RegExp(`:${key}`, 'g'), encodedVal);
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
      if (result?.meta?.code !== 200) {
        const errorMessage = result?.meta?.message || 'Unexpected response during api call';
        const errorDetails: any = {
          message: result?.meta.message,
          code: result?.meta?.code,
          details: result?.meta?.details,
          type: result?.meta?.type,
        };
        throw new QueryError('Failed to run Query', errorMessage, errorDetails);
      }
      return {
        status: 'ok',
        data: result,
      };
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      const errorDetails: any = {
        message: err?.data?.message,
        name: err?.name,
        code: err?.data?.code,
        details: err?.data?.details,
        type: err?.data?.type,
      };
      if (err?.response) {
        errorDetails.status = err?.response?.status;
        errorDetails.response = err?.response?.data;
      }
      throw new QueryError('API call error', errorMessage, errorDetails);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const apiKey = sourceOptions?.['apiKey'];
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
        const errorMessage = result?.meta?.message || 'Unexpected response during connection test';
        const errorDetails: any = {
          message: result?.meta.message,
          code: result?.meta?.code,
          details: result?.meta?.details,
        };
        throw new QueryError('Failed to verify connection', errorMessage, errorDetails);
      }

      return {
        status: 'ok',
        message: 'Connection successful',
      };
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      const errorDetails: any = {
        message: errorMessage,
        name: err?.name,
        code: err?.code,
        details: err?.data?.details,
        type: err?.data?.type,
        raw: err,
      };
      if (err?.response) {
        errorDetails.status = err?.response?.status;
        errorDetails.response = err?.response?.data;
      }
      throw new QueryError('Connection failed', errorMessage, errorDetails);
    }
  }
}
