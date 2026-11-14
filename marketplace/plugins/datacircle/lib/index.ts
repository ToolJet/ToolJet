import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import got from 'got';
import { SourceOptions } from './types';

const BASE_URL = 'https://api.datacircle.dev/v1';

export default class DatacircleQueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: any): Promise<QueryResult> {
    const operation = queryOptions.operation;
    let url = `${BASE_URL}${queryOptions['path']}`;

    const pathParams = queryOptions['params']['path'] || {};
    for (const param of Object.keys(pathParams)) {
      url = url.replace(`{${param}}`, encodeURIComponent(pathParams[param]));
    }

    const queryParams = queryOptions['params']['query'] || {};

    try {
      const response = await got(url, {
        method: operation.toLowerCase(),
        headers: { Accept: 'application/json' },
        searchParams: queryParams,
      });
      return {
        status: 'ok',
        data: JSON.parse(response.body),
      };
    } catch (error) {
      let errorDetails = {};
      let errorMessage = 'Datacircle operation failed';

      if (error.response) {
        try {
          const errResponse = JSON.parse(error.response.body);
          errorDetails = errResponse;
          errorMessage = errResponse.message || errResponse.error || errorMessage;
        } catch (e) {
          errorDetails = { rawError: error.response.body };
        }
      }

      throw new QueryError(errorMessage, error.message, errorDetails);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      await got(`${BASE_URL}/apis`, { method: 'get', headers: { Accept: 'application/json' } });
      return {
        status: 'ok',
        message: 'Successfully connected to the Datacircle API',
      };
    } catch (error) {
      throw new QueryError(
        'Datacircle connection test failed',
        error.response?.body || 'Failed to connect to the Datacircle API',
        {}
      );
    }
  }
}
