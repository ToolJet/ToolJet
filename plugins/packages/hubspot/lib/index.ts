import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { HTTPError, OptionsOfTextResponseBody } from 'got';

export default class HubSpot implements QueryService {
  private baseUrl = 'https://api.hubapi.com';

  private buildHeaders(sourceOptions: SourceOptions, customHeaders?: Array<[string, string]>): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${sourceOptions.api_key}`,
      'Content-Type': 'application/json',
    };

    // Add custom headers if provided
    if (customHeaders && Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        if (key && value) {
          headers[key] = value;
        }
      });
    }

    return headers;
  }

  private buildSearchParams(params?: Array<[string, string]>): URLSearchParams {
    const searchParams = new URLSearchParams();
    
    if (params && Array.isArray(params)) {
      params.forEach(([key, value]) => {
        if (key && value) {
          searchParams.append(key, value);
        }
      });
    }

    return searchParams;
  }

  private buildRequestBody(queryOptions: QueryOptions): any {
    if (queryOptions.body_toggle && queryOptions.raw_body) {
      // Use raw body if toggle is enabled
      try {
        return JSON.parse(queryOptions.raw_body);
      } catch (e) {
        return queryOptions.raw_body;
      }
    } else if (queryOptions.body && typeof queryOptions.body === 'object') {
      return queryOptions.body;
    } else if (queryOptions.body && typeof queryOptions.body === 'string') {
      try {
        return JSON.parse(queryOptions.body);
      } catch (e) {
        return queryOptions.body;
      }
    }
    return undefined;
  }

  private getResponse(response: any): any {
    try {
      if (typeof response.body === 'string' && this.isJson(response.body)) {
        return JSON.parse(response.body);
      }
    } catch (error) {
      console.error('Error while parsing HubSpot API response', error);
    }
    return response.body;
  }

  private isJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    try {
      // Build the full URL
      const endpoint = queryOptions.endpoint || '';
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      // Determine HTTP method
      const method = (queryOptions.method || 'GET').toUpperCase();
      
      // Build request options
      const requestOptions: OptionsOfTextResponseBody = {
        method: method as any,
        headers: this.buildHeaders(sourceOptions, queryOptions.headers),
        searchParams: this.buildSearchParams(queryOptions.params),
        retry: 0, // Disable retries for now
      };

      // Add body for non-GET requests
      if (method !== 'GET') {
        const body = this.buildRequestBody(queryOptions);
        if (body !== undefined) {
          if (typeof body === 'object') {
            requestOptions.json = body;
          } else {
            requestOptions.body = body;
          }
        }
      }

      // Make the API call
      const response = await got(url, requestOptions);
      const data = this.getResponse(response);

      return {
        status: 'ok',
        data,
      };
    } catch (error) {
      console.error('Error while calling HubSpot API:', error);
      
      if (error instanceof HTTPError) {
        const statusCode = error.response?.statusCode;
        const responseBody = error.response?.body;
        
        if (statusCode === 401) {
          throw new QueryError('Unauthorized: Invalid API key', error.message, {
            statusCode,
            responseBody,
          });
        } else if (statusCode === 403) {
          throw new QueryError('Forbidden: Insufficient permissions', error.message, {
            statusCode,
            responseBody,
          });
        } else if (statusCode === 429) {
          throw new QueryError('Rate limit exceeded', error.message, {
            statusCode,
            responseBody,
          });
        }
      }
      
      throw new QueryError('HubSpot API query failed', (error as Error).message, {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      // Test connection by calling a simple HubSpot API endpoint
      const response = await got(`${this.baseUrl}/contacts/v1/lists/all/contacts/all`, {
        method: 'GET',
        headers: this.buildHeaders(sourceOptions),
        searchParams: { count: 1 }, // Limit to 1 result for testing
        retry: 0,
      });

      if (response.statusCode === 200) {
        return {
          status: 'ok',
        };
      } else {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      
      if (error instanceof HTTPError) {
        const statusCode = error.response?.statusCode;
        
        if (statusCode === 401) {
          return {
            status: 'failed',
            message: 'Invalid API key. Please check your HubSpot API key.',
          };
        } else if (statusCode === 403) {
          return {
            status: 'failed', 
            message: 'Access denied. Please check your HubSpot API permissions.',
          };
        }
      }
      
      return {
        status: 'failed',
        message: `Connection failed: ${(error as Error).message}`,
      };
    }
  }
}