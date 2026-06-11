import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import got, { Headers } from 'got';
import { SourceOptions } from './types';

export default class StripeQueryService implements QueryService {
  authHeader(token: string): Headers {
    return { Authorization: `Bearer ${token}` };
  }

  async run(sourceOptions: SourceOptions, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    const operation = queryOptions.operation;

    const apiKey = sourceOptions.api_key;
    const baseUrl = 'https://api.stripe.com';
    const path = queryOptions['path'];
    let url = `${baseUrl}${path}`;

    const pathParams = queryOptions['params']['path'];
    const queryParams = queryOptions['params']['query'];
    const bodyParams = queryOptions['params']['request'];

    // Replace path params of url
    for (const param of Object.keys(pathParams)) {
      url = url.replace(`{${param}}`, pathParams[param]);
    }

    let response = null;

    try {
      if (operation === 'get') {
        response = await got(url, {
          method: operation,
          headers: this.authHeader(apiKey),
          searchParams: queryParams,
        });
      } else {
        const resolvedBodyParams = this.resolveBodyparams(bodyParams);
        response = await got(url, {
          method: operation,
          headers: this.authHeader(apiKey),
          form: resolvedBodyParams,
          searchParams: queryParams,
        });
      }

      result = JSON.parse(response.body);
    } catch (error) {
      throw new QueryError('Query could not be completed', error.response.body, {});
    }

    return {
      status: 'ok',
      data: result,
    };
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
