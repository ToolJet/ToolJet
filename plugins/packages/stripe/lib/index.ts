import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import got, { Headers } from 'got';
import { SourceOptions } from './types';
import Stripe from 'stripe';

export default class StripeQueryService implements QueryService {
  authHeader(token: string): Headers {
    return { Authorization: `Bearer ${token}` };
  }

  async run(sourceOptions: SourceOptions, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    const operation = queryOptions.operation;
    const stripe = new Stripe(`${sourceOptions.api_key}`, {
      apiVersion: '2020-08-27',
    });
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
    console.log('path poram************', pathParams, queryParams, queryOptions['params']['request']);

    let response = null;
    if (url == 'https://api.stripe.com/v1/refunds' && operation === 'post') {
      console.log('ENTRY DONE ________________++++++++++');

      const refund = await stripe.refunds.create(queryOptions['params']['request']);
      console.log('refund', refund);
    } else {
      console.log('ENTRY DONE%%%%%%%%%%%%%%%%%%%');

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
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
