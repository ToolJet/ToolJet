const urrl = require('url');
import got, { Headers, HTTPError, OptionsOfTextResponseBody } from 'got';
import {
  App,
  getCurrentToken,
  OAuthUnauthorizedClientError,
  QueryError,
  QueryResult,
  QueryService,
  User,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

function isEmpty(value: number | null | undefined | string) {
  return (
    value === undefined ||
    value === null ||
    !isNaN(value as number) ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
}

function sanitizeCustomParams(customArray: any) {
  const params = Object.fromEntries(customArray ?? []);
  Object.keys(params).forEach((key) => (params[key] === '' ? delete params[key] : {}));
  return params;
}

export default class GraphqlQueryService implements QueryService {
  constructor(private sendRequest = got) {}

  authUrl(sourceOptions: SourceOptions): string {
    const customQueryParams = sanitizeCustomParams(sourceOptions['custom_query_params']);
    const tooljetHost = process.env.TOOLJET_HOST;
    const authUrl = new URL(
      `${sourceOptions['auth_url']}?response_type=code&client_id=${sourceOptions['client_id']}&redirect_uri=${tooljetHost}/oauth2/authorize&scope=${sourceOptions['scopes']}`
    );
    Object.entries(customQueryParams).map(([key, value]) => authUrl.searchParams.append(key, value));
    return authUrl.toString();
  }
  /* Headers of the source will be overridden by headers of the query */
  headers(sourceOptions: any, queryOptions: any, hasDataSource: boolean): Headers {
    const _headers = (queryOptions.headers || []).filter((o) => {
      return o.some((e) => !isEmpty(e));
    });

    if (!hasDataSource) return Object.fromEntries(_headers);

    const headerData = _headers.concat(sourceOptions.headers || []);

    const headers = Object.fromEntries(headerData);
    Object.keys(headers).forEach((key) => (headers[key] === '' ? delete headers[key] : {}));

    return headers;
  }

  async run(
    sourceOptions: any,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    /* REST API queries can be adhoc or associated with a REST API datasource */
    const hasDataSource = dataSourceId !== undefined;
    const authType = sourceOptions['auth_type'];
    const requiresOauth = authType === 'oauth2';

    const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];

    const url = sourceOptions.url;
    const { query, variables } = queryOptions;
    // Query takes precedence over source.
    const headers = this.headers(sourceOptions, queryOptions, hasDataSource);

    /* Chceck if OAuth tokens exists for the source if query requires OAuth */
    if (requiresOauth) {
      const tokenData = sourceOptions['tokenData'];
      const isAppPublic = context?.app.isPublic;
      const userData = context?.user;
      const currentToken = getCurrentToken(isMultiAuthEnabled, tokenData, userData?.id, isAppPublic);

      if (!currentToken && !userData?.id && isAppPublic) {
        throw new QueryError('Missing access token', {}, {});
      }

      if (!currentToken) {
        return {
          status: 'needs_oauth',
          data: { auth_url: this.authUrl(sourceOptions) },
        };
      } else {
        const accessToken = currentToken['access_token'];
        if (sourceOptions['add_token_to'] === 'header') {
          const headerPrefix = sourceOptions['header_prefix'];
          headers['Authorization'] = `${headerPrefix}${accessToken}`;
        }
      }
    }

    const searchParams = Object.fromEntries(sourceOptions['url_params']);

    // Remove invalid entries from the searchParams objects
    Object.keys(searchParams).forEach((key) => (searchParams[key] === '' ? delete searchParams[key] : {}));

    if (authType === 'bearer') {
      headers['Authorization'] = `Bearer ${sourceOptions.bearer_token}`;
    }

    const json = {
      query,
      variables: variables ? JSON.parse(variables) : {},
    };

    let result = {};

    try {
      const requestOptions: OptionsOfTextResponseBody = {
        method: 'post',
        headers,
        searchParams,
        json,
      };

      if (authType === 'basic') {
        requestOptions.username = sourceOptions.username;
        requestOptions.password = sourceOptions.password;
      }
      const response = await this.sendRequest(url, requestOptions);
      result = JSON.parse(response.body);
    } catch (error) {
      if (requiresOauth && error?.response?.statusCode == 401) {
        throw new OAuthUnauthorizedClientError('Unauthorized status from API server', error.message, result);
      }

      if (error instanceof HTTPError) {
        result = {
          requestObject: {
            requestUrl: sourceOptions.password // Remove password from error object
              ? error.request.requestUrl?.replace(`${sourceOptions.password}@`, '<password>@')
              : error.request.requestUrl,
            requestHeaders: error.request.options.headers,
            requestParams: urrl.parse(error.request.requestUrl, true).query,
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
    };
  }

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
    const currentToken = getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic);
    const refreshToken = currentToken['refresh_token'];
    if (!refreshToken) {
      throw new QueryError('Refresh token not found', error.response, {});
    }
    const accessTokenUrl = sourceOptions['access_token_url'];
    const clientId = sourceOptions['client_id'];
    const clientSecret = sourceOptions['client_secret'];
    const grantType = 'refresh_token';
    const customAccessTokenHeaders = sanitizeCustomParams(sourceOptions['access_token_custom_headers']);

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      refresh_token: refreshToken,
    };

    const accessTokenDetails = {};
    let result, response;

    try {
      response = await got(accessTokenUrl, {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...customAccessTokenHeaders,
        },
        form: data,
      });
      result = JSON.parse(response.body);
    } catch (error) {
      console.error(
        `Error while refreshing access token. Status code : ${error.response?.statusCode}, Message : ${error.response?.body}`
      );
      if (error instanceof HTTPError) {
        result = {
          requestObject: {
            requestUrl: error.request?.requestUrl,
            requestHeaders: error.request?.options?.headers,
            requestParams: urrl.parse(accessTokenUrl, true).query,
          },
          responseObject: {
            statusCode: error.response?.statusCode,
            responseBody: error.response?.body,
          },
          responseHeaders: error.response?.headers,
        };
      }
      if (error.response?.statusCode >= 400 && error.response?.statusCode < 500) {
        throw new OAuthUnauthorizedClientError(
          'Unauthorized status from Oauth server',
          JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
          result
        );
      }
      throw new QueryError(
        'could not connect to Oauth server',
        JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
        result
      );
    }

    if (!(response.statusCode >= 200 || response.statusCode < 300)) {
      throw new QueryError(
        'could not connect to Oauth server. status code',
        JSON.stringify({ statusCode: response.statusCode }),
        {
          responseObject: {
            statusCode: response.statusCode,
            responseBody: response.body,
          },
          responseHeaders: response.headers,
        }
      );
    }

    if (result['access_token']) {
      accessTokenDetails['access_token'] = result['access_token'];
      accessTokenDetails['refresh_token'] = result['refresh_token'] || refreshToken;
    } else {
      throw new QueryError(
        'access_token not found in the response',
        {},
        {
          responseObject: {
            statusCode: response.statusCode,
            responseBody: response.body,
          },
          responseHeaders: response.headers,
        }
      );
    }
    return accessTokenDetails;
  }
}
