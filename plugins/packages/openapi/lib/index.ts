import {
  QueryResult,
  User,
  App,
  OAuthUnauthorizedClientError,
  QueryError,
  QueryService,
  getRefreshedToken,
  validateAndSetRequestOptionsBasedOnAuthType,
  getAuthUrl,
  ForbiddenRequestError,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, RestAPIResult } from './types';
import got, { HTTPError, OptionsOfTextResponseBody } from 'got';
import urrl from 'url';

export default class Openapi implements QueryService {
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

  // FIXME: Hardcoding link local address of aws metadata service
  // to prevent SSRF attacks. Making the request first to infer if
  // from GOT resp.
  private async makeRequest(url, requestOptions) {
    const urlContainsForbiddenIp = url.includes('169.254.169.254');
    if (urlContainsForbiddenIp) {
      throw new ForbiddenRequestError('Forbidden', {}, {});
    }

    const response = await got(url, requestOptions);
    const remoteIp = response?.socket?.remoteAddress;
    if (!!remoteIp && remoteIp.indexOf('169.254.169.254') != -1) {
      throw new ForbiddenRequestError('Forbidden', {}, {});
    }

    return response;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<RestAPIResult> {
    const { host, path, operation, params } = queryOptions;
    const { request, query, header, path: pathParams } = params;
    const url = new URL(host + this.resolvePathParams(pathParams, path));
    const json = operation !== 'get' ? this.sanitizeObject(request) : undefined;

    const _requestOptions: OptionsOfTextResponseBody = {
      method: operation,
      headers: header,
      searchParams: {
        ...query,
      },
      json,
    };

    const authValidatedRequestOptions: QueryResult = validateAndSetRequestOptionsBasedOnAuthType(
      sourceOptions,
      context,
      _requestOptions,
      { url }
    );
    const { status, data } = authValidatedRequestOptions;
    if (status === 'needs_oauth') return authValidatedRequestOptions;

    const requestOptions = data as OptionsOfTextResponseBody;

    let result = {};
    let requestObject = {};
    let responseObject = {};
    let responseHeaders = {};

    try {
      const response = await this.makeRequest(url, requestOptions);

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
      if (sourceOptions['auth_type'] === 'oauth2' && error?.response?.statusCode == 401) {
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

  authUrl(sourceOptions: SourceOptions): string {
    return getAuthUrl(sourceOptions);
  }

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
