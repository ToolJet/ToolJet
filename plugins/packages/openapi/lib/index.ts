import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { HTTPError } from 'got';
import urrl from 'url';
const { CookieJar } = require('tough-cookie');

interface RestAPIResult extends QueryResult {
  request?: Array<object> | object;
  response?: Array<object> | object;
  responseHeaders?: Array<object> | object;
}

export default class Openapi implements QueryService {
  resolvePathParams(params: any, path: string) {
    let newString = path;
    Object.entries(params).map(([key, value]) => {
      newString = newString.replace(`{${key}}`, value as any);
    });
    return newString;
  }

  sanitizeObject(params: any) {
    Object.keys(params).forEach((key) => (params[key] === '' ? delete params[key] : {}));
    return params;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<RestAPIResult> {
    const { host, path, operation, params } = queryOptions;
    const { header, query, request } = params;
    const pathParams = params.path;
    const authType = sourceOptions['auth_type'];
    const cookieJar = new CookieJar();

    const url = new URL(host + this.resolvePathParams(pathParams, path));
    const json = operation !== 'get' ? this.sanitizeObject(request) : undefined;

    let result = {};
    let requestObject = {};
    let responseObject = {};
    let responseHeaders = {};

    if (authType === 'bearer') {
      header['Authorization'] = `Bearer ${sourceOptions.bearer_token}`;
    }

    const resolveApiKeyParams = () => {
      const apiKeys = sourceOptions.api_keys;
      Object.keys(apiKeys).map((key) => {
        const keyObj = apiKeys[key];
        const { value, name } = keyObj;
        const type = keyObj.in;
        if (type === 'header') {
          header[name] = value;
        } else if (type === 'query') {
          url.searchParams.append(name, value);
        } else if (type === 'cookie') {
          cookieJar.setCookie(`${name}=${value}`, url);
        }
      });
    };

    if (authType === 'apiKey') {
      resolveApiKeyParams();
    }

    try {
      const response = await got(url, {
        method: operation,
        headers: header,
        username: authType === 'basic' ? sourceOptions.username : undefined,
        password: authType === 'basic' ? sourceOptions.password : undefined,
        searchParams: {
          ...query,
        },
        json,
        cookieJar,
      });

      result = JSON.parse(response.body);
      requestObject = {
        requestUrl: response.request.requestUrl,
        method: response.request.options.method,
        headers: response.request.options.headers,
        params: urrl.parse(response.request.requestUrl.toString(), true).query,
      };

      responseObject = {
        body: response.body,
        statusCode: response.statusCode,
      };

      responseHeaders = response.headers;
    } catch (error) {
      console.log(error);

      if (error instanceof HTTPError) {
        result = {
          requestObject: {
            requestUrl: error.request.requestUrl,
            requestHeaders: error.request.options.headers,
            requestParams: urrl.parse(error.request.requestUrl.toString(), true).query,
          },
          responseObject: {
            statusCode: error.response.statusCode,
            responseBody: error.response.body,
          },
          responseHeaders: error.response.headers,
        };
      }
      throw new QueryError('Query could not be completed', error.message, result);
    }

    return {
      status: 'ok',
      data: result,
      request: requestObject,
      response: responseObject,
      responseHeaders,
    };
  }
}
