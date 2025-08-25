import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
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
    const baseUrl = 'https://api.easypost.com';
    const path = queryOptions['path'];
    let url = `${baseUrl}${path}`;

    // Handle path parameters
    const pathParams = queryOptions['params']['path'] || {};
    for (const param of Object.keys(pathParams)) {
      url = url.replace(`{${param}}`, pathParams[param]);
    }

    // Handle query parameters
    const queryParams = queryOptions['params']['query'] || {};

    // Handle body parameters
    const bodyParams = queryOptions['params']['request'] || {};
    const jsonBody = Object.keys(bodyParams).length > 0 ? bodyParams : undefined;

    try {
     const options: any = {
        method: operation.toLowerCase(),
        headers: this.authHeader(apiKey),
        searchParams: queryParams,
      };
      if (Object.keys(bodyParams).length > 0) {
        options.json = bodyParams;
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
}