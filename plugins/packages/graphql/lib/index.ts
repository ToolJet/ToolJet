const urrl = require('url');
import got, { HTTPError, OptionsOfTextResponseBody } from 'got';
import {
  App,
  OAuthUnauthorizedClientError,
  QueryError,
  QueryResult,
  QueryService,
  User,
  validateAndSetRequestOptionsBasedOnAuthType,
  sanitizeHeaders,
  sanitizeSearchParams,
  fetchHttpsCertsForCustomCA,
  getRefreshedToken,
} from '@tooljet-plugins/common';
import { QueryOptions } from './types';

export default class GraphqlQueryService implements QueryService {
  constructor(private sendRequest = got) {}

  async run(
    sourceOptions: any,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const url = sourceOptions.url;
    const { query, variables } = queryOptions;
    const json = {
      query,
      variables: variables ? JSON.parse(variables) : {},
    };

    const paramsFromUrl = urrl.parse(url, true).query;
    const _requestOptions: OptionsOfTextResponseBody = {
      method: 'post',
      headers: sanitizeHeaders(sourceOptions, queryOptions),
      searchParams: {
        ...paramsFromUrl,
        ...sanitizeSearchParams(sourceOptions, queryOptions),
      },
      json,
      ...fetchHttpsCertsForCustomCA(),
    };

    const authValidatedRequestOptions = validateAndSetRequestOptionsBasedOnAuthType(
      sourceOptions,
      context,
      _requestOptions,
      { url }
    );
    const { status, data } = authValidatedRequestOptions;
    if (status === 'needs_oauth') return authValidatedRequestOptions;
    const requestOptions = data as OptionsOfTextResponseBody;

    let result = {};

    try {
      const response = await this.sendRequest(url, requestOptions);
      result = JSON.parse(response.body);
    } catch (error) {
      console.error(
        `Error while calling GraphQL end point. status code: ${error?.response?.statusCode} message: ${error?.response?.body}`
      );

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

      if (sourceOptions['auth_type'] === 'oauth2' && error?.response?.statusCode == 401) {
        throw new OAuthUnauthorizedClientError('Unauthorized status from API server', error.message, result);
      }

      throw new QueryError('Query could not be completed', error.message, result);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
