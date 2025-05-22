import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions } from './types';
import got, { Headers } from 'got';

export default class Clickup implements QueryService {
  authHeader(token: string): Headers {
    return { Authorization: token };
  }

  async run(sourceOptions: SourceOptions, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const apiKey = sourceOptions.apiKey;
    const baseUrl = 'https://api.clickup.com/api';
    const path = queryOptions['path'];

    const pathParams = queryOptions['params']['path'];
    const queryParams = queryOptions['params']['query'];
    const bodyParams = queryOptions['params']['request'];

    // Replace path params in URL
    let modifiedPath = path;
    for (const param of Object.keys(pathParams)) {
      modifiedPath = modifiedPath.replace(`{${param}}`, pathParams[param]);
    }

    const url = `${baseUrl}${modifiedPath}`;

    try {
      let response;

      if (operation === 'get' || operation === 'delete') {
        response = await got(url, {
          method: operation,
          headers: this.authHeader(apiKey),
          searchParams: queryParams,
        });
      } else {
        // post, put, patch operations
        const resolvedBodyParams = this.resolveBodyparams(bodyParams);
        response = await got(url, {
          method: operation,
          headers: this.authHeader(apiKey),
          json: resolvedBodyParams,
          searchParams: queryParams,
        });
      }

      return {
        status: 'ok',
        data: JSON.parse(response.body),
      };
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      const errorDetails: any = {};

      if (err.response) {
        const { statusCode, body } = err.response;
        errorDetails.statusCode = statusCode;

        try {
          const parsedBody = JSON.parse(body);
          errorDetails.error = parsedBody.err || null;
          errorDetails.code = parsedBody.ECODE || null;
        } catch (parseError) {
          errorDetails.rawBody = body;
        }
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const apiKey = sourceOptions.apiKey;

    try {
      const response = await got('https://api.clickup.com/api/v2/user', {
        headers: this.authHeader(apiKey),
      });

      const data = JSON.parse(response.body);

      if (data?.user?.id) {
        return {
          status: 'ok',
        };
      } else {
        throw new QueryError('User information not found', 'Invalid API key or insufficient permissions', {});
      }
    } catch (error) {
      throw new QueryError('Connection could not be established', error.response?.body || error.message, {});
    }
  }

  private resolveBodyparams(bodyParams: object): object {
    if (typeof bodyParams === 'string') {
      return bodyParams;
    }

    const expectedResult = {};

    for (const key of Object.keys(bodyParams)) {
      if (typeof bodyParams[key] === 'object') {
        for (const subKey of Object.keys(bodyParams[key])) {
          expectedResult[`${key}[${subKey}]`] = bodyParams[key][subKey];
        }
      } else {
        expectedResult[key] = bodyParams[key];
      }
    }

    return expectedResult;
  }
}
