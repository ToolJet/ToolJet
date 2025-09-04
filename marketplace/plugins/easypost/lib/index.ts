import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import got, { Headers } from 'got';
import { SourceOptions } from './types';

export default class EasyPostQueryService implements QueryService {
  authHeader(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async run(sourceOptions: SourceOptions, queryOptions: any): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const apiKey = sourceOptions.api_key;
    const baseUrl = 'https://api.easypost.com/v2';
    const path = queryOptions['path'];
    let url = `${baseUrl}${path}`;

    // Handle path parameters
    const pathParams = queryOptions['params']['path'] || {};
    for (const param of Object.keys(pathParams)) {
      url = url.replace(`{${param}}`, pathParams[param]);
    }

    // Handle query parameters
    const queryParams = queryOptions['params']['query'] || {};

    // Handle body parameters - parse JSON strings to objects
    const requestBody = queryOptions['params']['request'] || {};
    const processedBody = this.processRequestBody(requestBody);
    try {
      const options: any = {
        method: operation.toLowerCase(),
        headers: this.authHeader(apiKey),
        searchParams: queryParams,
      };

      if (Object.keys(processedBody).length > 0) {
        options.json = processedBody;
      }

      const response = await got(url, options);
      return {
        status: 'ok',
        data: JSON.parse(response.body)
      };
    } catch (error) {
      let errorDetails = {};
      let errorMessage = 'EasyPost operation failed';

      if (error.response) {
        try {
          const errResponse = JSON.parse(error.response.body);
          errorDetails = errResponse.error || {};
          errorMessage = errResponse.error?.message || errorMessage;
        } catch (e) {
          errorDetails = { rawError: error.response.body };
        }
      }

      throw new QueryError(errorMessage, error.message, errorDetails);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
  const apiKey = sourceOptions.api_key;
  if (!apiKey) {
    throw new QueryError('Connection failed', 'API key is required', {});
  }
  try {
    await got('https://api.easypost.com/v2/addresses', {
      method: 'get',
      headers: this.authHeader(apiKey),
      searchParams: { page_size: 1 }
    });
    return {
      status: 'ok',
      message: 'Successfully connected to EasyPost API'
    };
  } catch (error) {
    throw new QueryError(
      'EasyPost connection test failed',
      error.response?.body || 'Failed to connect to EasyPost API',
      {}
    );
  }
}

  private processRequestBody(body: any): any {
    if (typeof body !== 'object' || body === null) {
      return body;
    }

    const processed: any = {};

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        try {
          // Try to parse JSON strings
          processed[key] = JSON.parse(value);
        } catch (e) {
          // If it's not valid JSON, keep as string
          processed[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        processed[key] = this.processRequestBody(value);
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }
}