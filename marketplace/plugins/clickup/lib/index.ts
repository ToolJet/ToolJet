import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got'; // Pasted from stripe plugin for testing purposes.
import axios, { AxiosInstance } from 'axios';

export default class Clickup implements QueryService {

  /* 
   * Pasted from stripe plugin for testing purposes.
   *
  authHeader(token: string): Headers {
    return { Authorization: `Bearer ${token}` };
  }*/

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    /*
     * Pasted from stripe plugin for testing purposes.
     *
    let result = {};
    const operation = queryOptions.operation;

    const apiKey = sourceOptions.apiKey;
    const baseUrl = 'https://api.clickup.com/api';
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
    }*/

    return {
      status: 'ok',
      data: {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const client = await this.getConnection(sourceOptions);

    try {
      const response = await client.get('/v2/team');

      // Check if at least one team (workspace) is returned
      if (response.data?.teams?.length > 0) {
        return {
          status: 'ok',
        };
      } else {
        throw new QueryError('No teams found', 'The team list is empty', {});
      }
    } catch (error) {
      throw new QueryError(
        'Connection could not be established',
        error?.response?.data?.err || error?.message,
        {}
      );
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<AxiosInstance> {
    const { apiKey } = sourceOptions;

    const client = axios.create({
      baseURL: 'https://api.clickup.com/api',
      headers: {
        Authorization: apiKey,
      }
    });

    return client;
  }

  /*
   * Pasted from stripe plugin for testing purposes.
   *
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
  }*/
}
