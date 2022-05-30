import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import got, { Headers } from 'got';
import { SourceOptions } from './types';
import Stripe from 'stripe';
const stripe = new Stripe(
  'sk_test_51KPPFsSIMIhrzXWAUfJ82xsqvqFYBaTT9tyqX75ji2j5Hp8fGm4G7dxL40k6vhH7W9vnJBXffhRw43FFDKa3TjFU00Yt7oEwoo',
  {
    apiVersion: '2020-08-27',
  }
);
// const stripe = new Stripe(
//   'sk_test_51KPPFsSIMIhrzXWAUfJ82xsqvqFYBaTT9tyqX75ji2j5Hp8fGm4G7dxL40k6vhH7W9vnJBXffhRw43FFDKa3TjFU00Yt7oEwoo',
//   {
//     apiVersion: '2020-08-27',
//   }
// );
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
        console.log('***', response);
      } else {
        const refund = await stripe.refunds.retrieve('re_3L4rLk2eZvKYlo2C1enubJKW');
        console.log('_____&&&&!!!!!!!!', refund);
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
