import { QueryError, QueryResult,  QueryService} from 'common';


import {Headers} from 'got'
import got from 'got'

export default class StripeQueryService implements QueryService {
  authHeader(token: string): Headers {
    return { Authorization: `Bearer ${token}` };
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    const operation = queryOptions.operation;

    const apiKey = sourceOptions['api_key'];
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
        response = await got(url, {
          method: operation,
          headers: this.authHeader(apiKey),
          json: bodyParams,
          searchParams: queryParams,
        });
      }

      result = JSON.parse(response.body);
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
