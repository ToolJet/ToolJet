const urrl = require('url');
import { readFileSync } from 'fs';            
import * as tls from 'tls';                  
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
  sanitizeCookies,                            
  cookiesToString,                            
  fetchHttpsCertsForCustomCA,
  getRefreshedToken,
  getAuthUrl,
  redactHeaders,
  validateUrlForSSRF,
  getSSRFProtectionOptions,
} from '@tooljet-plugins/common';
import { QueryOptions, SourceOptions } from './types';

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

    // SSRF Protection: Validate URL before making request
    await validateUrlForSSRF(url);

    const { query, variables } = queryOptions;
    const json = {
      query,
      variables: variables ? JSON.parse(variables) : {},
    };

    const paramsFromUrl = urrl.parse(url, true).query;
    const searchParams = new URLSearchParams();
    const hasDataSource = dataSourceId !== undefined;

    // Append parameters individually to preserve duplicates
    for (const [key, value] of Object.entries(paramsFromUrl)) {
      if (Array.isArray(value)) {
        value.forEach((val) => searchParams.append(key, val));
      } else {
        searchParams.append(key, String(value));
      }
    }
    for (const [key, value] of sanitizeSearchParams(sourceOptions, queryOptions, hasDataSource)) {
      searchParams.append(key, String(value));
    }
    const sourceBody = Object.fromEntries(
      (sourceOptions.body || []).filter(([k]: [string]) => k)
    );
    const mergedJson = { ...sourceBody, ...json };

    const headers = sanitizeHeaders(sourceOptions, queryOptions, hasDataSource);

    const cookieString = cookiesToString(
      sanitizeCookies(sourceOptions, queryOptions, hasDataSource)
    );
    if (cookieString) {
      (headers as Record<string, string>)['Cookie'] = cookieString;
    }

    const _requestOptions: OptionsOfTextResponseBody = {
      method: 'post',
      headers,
      searchParams,
      json: mergedJson,
      ...this.fetchHttpsCertsForCustomCA(sourceOptions),
    };

    const authValidatedRequestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
      sourceOptions,
      context,
      _requestOptions
    );
    const { status, data } = authValidatedRequestOptions;
    if (status === 'needs_oauth') return authValidatedRequestOptions;
    const requestOptions = data as OptionsOfTextResponseBody;

    // Apply SSRF protection options (custom DNS lookup + redirect validation)
    // Pass requestOptions to properly merge hooks and other options
    const finalOptions = getSSRFProtectionOptions(undefined, requestOptions);

    let result = {};
    let requestObject = {};
    let responseObject = {};

    try {
      const response = await this.sendRequest(url, finalOptions);
      result = JSON.parse(response.body);

      requestObject = {
        url: response.requestUrl,
        method: response.request.options.method,
        headers: redactHeaders(response.request.options.headers),
        params: urrl.parse(response.request.requestUrl, true).query,
      };

      responseObject = {
        statusCode: response.statusCode,
        headers: redactHeaders(response.headers),
      };
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
      metadata: {
        request: requestObject,
        response: responseObject,
      },
    };
  }

  fetchHttpsCertsForCustomCA(sourceOptions: any) {
    if (!sourceOptions.ssl_certificate) {
      return fetchHttpsCertsForCustomCA();
    }

    let httpsParams: any = {};

    switch (sourceOptions.ssl_certificate) {
      case 'ca_certificate':
        httpsParams = { https: { certificateAuthority: [sourceOptions.ca_cert] } };
        break;

      case 'client_certificate':
        httpsParams = {
          https: {
            certificateAuthority: [sourceOptions.ca_cert],
            key: [sourceOptions.client_key],
            certificate: [sourceOptions.client_cert],
          },
        };
        break;

      case 'none':
        httpsParams = { https: { rejectUnauthorized: false } };
        break;

      default:
        return fetchHttpsCertsForCustomCA();
    }

    if (process.env.NODE_EXTRA_CA_CERTS) {
      'https' in httpsParams
        ? (httpsParams.https.certificateAuthority =
            httpsParams.https?.certificateAuthority.concat([
              ...tls.rootCertificates,
              readFileSync(process.env.NODE_EXTRA_CA_CERTS),
            ]))
        : (httpsParams = {
            https: {
              certificateAuthority: [
                ...tls.rootCertificates,
                readFileSync(process.env.NODE_EXTRA_CA_CERTS),
              ].join('\n'),
            },
          });
    }

    return httpsParams;
  }

  authUrl(sourceOptions: SourceOptions): string {
    return getAuthUrl(sourceOptions);
  }

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
