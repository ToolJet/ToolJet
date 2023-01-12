import {
  OAuthUnauthorizedClientError,
  QueryError,
  QueryService,
  getRefreshedToken,
  sanitizeCustomParams,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, RestAPIResult } from './types';
import got, { HTTPError } from 'got';
import urrl from 'url';
const { CookieJar } = require('tough-cookie');

export default class Openapi implements QueryService {
  authUrl(sourceOptions: SourceOptions): string {
    const customQueryParams = sanitizeCustomParams(sourceOptions['custom_query_params']);
    const tooljetHost = process.env.TOOLJET_HOST;
    const authUrl = new URL(
      `${sourceOptions['auth_url']}?response_type=code&client_id=${sourceOptions['client_id']}&redirect_uri=${tooljetHost}/oauth2/authorize&scope=${sourceOptions['scopes']}`
    );
    Object.entries(customQueryParams).map(([key, value]) => authUrl.searchParams.append(key, value));
    return authUrl.toString();
  }
  private resolvePathParams(params: any, path: string) {
    let newString = path;
    Object.entries(params).map(([key, value]) => {
      newString = newString.replace(`{${key}}`, value as any);
    });
    return newString;
  }

  private sanitizeObject(params: any) {
    Object.keys(params).forEach((key) => (params[key] === '' ? delete params[key] : {}));
    return params;
  }

  private resolveApiKeyParams = (apiKeys, auth_key: string, header: any, url: URL, query: any, cookieJar: any) => {
    const processKey = (type: string, name: string, value: string) => {
      if (type === 'header') {
        header[name] = value;
      } else if (type === 'query') {
        query[name] = value;
      } else if (type === 'cookie') {
        cookieJar.setCookie(`${name}=${value}`, url);
      }
    };
    apiKeys.map((key: any) => {
      if (key.parentKey && key.parentKey === auth_key) {
        //process multiple keys
        key.fields.map((field: any) => {
          processKey(field.in, field.name, field.value);
        });
      } else {
        if (auth_key === key.key) {
          processKey(key.in, key.name, key.value);
          return;
        }
      }
    });

    return { header, query, cookieJar };
  };

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<RestAPIResult> {
    const { host, path, operation, params } = queryOptions;
    const { request } = params;
    let { query, header } = params;
    const pathParams = params.path;
    const authType = sourceOptions['auth_type'];
    const requiresOauth = authType === 'oauth2';
    let cookieJar = new CookieJar();

    const url = new URL(host + this.resolvePathParams(pathParams, path));
    const json = operation !== 'get' ? this.sanitizeObject(request) : undefined;

    let result = {};
    let requestObject = {};
    let responseObject = {};
    let responseHeaders = {};

    if (authType === 'bearer') {
      header['Authorization'] = `Bearer ${sourceOptions.bearer_token}`;
    }

    if (authType === 'apiKey') {
      const resolved = this.resolveApiKeyParams(
        sourceOptions.api_keys,
        sourceOptions.auth_key,
        header,
        url,
        query,
        cookieJar
      );
      header = resolved.header;
      query = resolved.query;
      cookieJar = resolved.cookieJar;
    }

    /* Chceck if OAuth tokens exists for the source if query requires OAuth */
    if (requiresOauth) {
      const tokenData = sourceOptions['tokenData'];

      if (!tokenData) {
        return {
          status: 'needs_oauth',
          data: { auth_url: this.authUrl(sourceOptions) },
        };
      } else {
        const accessToken = tokenData['access_token'];
        if (sourceOptions['add_token_to'] === 'header') {
          const headerPrefix = sourceOptions['header_prefix'];
          header['Authorization'] = `${headerPrefix}${accessToken}`;
        }
      }
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
      if (requiresOauth && error?.response?.statusCode == 401) {
        throw new OAuthUnauthorizedClientError('Unauthorized status from API server', error.message, result);
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

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
