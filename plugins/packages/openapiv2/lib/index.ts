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
  validateUrlForSSRF,
  getSSRFProtectionOptions,
  isEmpty,
  sanitizeHeaders,
  sanitizeCookies,
  cookiesToString,
  sanitizeSearchParams,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, OpenApiV2Result } from './types';
import got, { HTTPError, OptionsOfTextResponseBody } from 'got';
import urrl from 'url';

// The spec is processed by a background worker into an operation index (see server
// @modules/openapi-spec) - run() only uses the host/path/params/auth already on the query, no spec walk here.
export default class OpenApiV2 implements QueryService {
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

  private parseValue = (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  };

  private parseRequest = (obj) => {
    if (!obj) return obj;
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = this.parseValue(obj[key]);
      return acc;
    }, {});
  };

  private buildSourceOptionsSearchParams(sourceOptions: SourceOptions): Record<string, string> {
    const pairs = sanitizeSearchParams({ url_params: sourceOptions.url_parameters }, {}, true);
    return Object.fromEntries(pairs as unknown as Array<[string, string]>);
  }

  private buildSourceOptionsBody(sourceOptions: SourceOptions): Record<string, unknown> | undefined {
    const sourceBody = (sourceOptions.body || []).filter((pair) => pair.some((value) => !isEmpty(value)));
    return sourceBody.length ? Object.fromEntries(sourceBody) : undefined;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<OpenApiV2Result> {
    const { host, path, operation, params } = queryOptions;
    const { request, query, header, path: pathParams } = params;
    const resolvedHost = sourceOptions.host || host;
    const url = new URL(resolvedHost + this.resolvePathParams(pathParams, path));

    await validateUrlForSSRF(url.toString());

    const parsedRequest = request ? this.parseRequest(request) : undefined;
    const operationJson =
      operation !== 'get' && parsedRequest && Object.keys(parsedRequest).length > 0
        ? this.sanitizeObject(parsedRequest)
        : undefined;
    const sourceOptionsBody = this.buildSourceOptionsBody(sourceOptions);
    const json = operationJson || sourceOptionsBody ? { ...operationJson, ...sourceOptionsBody } : undefined;

    const sourceOptionHeaders = sanitizeHeaders(sourceOptions, {}, true);
    const headers: Record<string, string> = { ...header, ...sourceOptionHeaders };

    const sanitizedCookies = sanitizeCookies(sourceOptions, {}, true);
    const cookieString = cookiesToString(sanitizedCookies);
    if (cookieString) {
      headers['Cookie'] = cookieString;
    }

    const _requestOptions: OptionsOfTextResponseBody = {
      method: operation,
      headers,
      searchParams: {
        ...query,
        ...this.buildSourceOptionsSearchParams(sourceOptions),
      },
    };

    if (json && Object.keys(json).length > 0) {
      _requestOptions.json = json;
    }

    const authValidatedRequestOptions: QueryResult = await validateAndSetRequestOptionsBasedOnAuthType(
      sourceOptions,
      context,
      _requestOptions,
      { url }
    );
    const { status, data } = authValidatedRequestOptions;
    if (status === 'needs_oauth') return authValidatedRequestOptions;

    const requestOptions = data as OptionsOfTextResponseBody;

    // Apply SSRF protection options (custom DNS lookup + redirect validation)
    const finalOptions = getSSRFProtectionOptions(undefined, requestOptions);

    let result = {};
    let requestObject = {};
    let responseObject = {};
    let responseHeaders = {};

    try {
      const response = await got(url, finalOptions);
      const contentType = response.headers['content-type'];

      result = contentType && contentType.includes('application/json') ? JSON.parse(response.body) : response.body;

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
