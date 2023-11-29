const urrl = require('url');
import { readFileSync } from 'fs';
import * as tls from 'tls';
import {
  QueryError,
  QueryResult,
  QueryService,
  cleanSensitiveData,
  User,
  App,
  OAuthUnauthorizedClientError,
  getRefreshedToken,
  checkIfContentTypeIsURLenc,
  isEmpty,
  validateAndSetRequestOptionsBasedOnAuthType,
  sanitizeHeaders,
  sanitizeSearchParams,
  getAuthUrl,
} from '@tooljet-plugins/common';
const JSON5 = require('json5');
import got, { HTTPError, OptionsOfTextResponseBody } from 'got';
import { SourceOptions } from './types';

interface RestAPIResult extends QueryResult {
  request?: Array<object> | object;
  response?: Array<object> | object;
  responseHeaders?: Array<object> | object;
}

export default class RestapiQueryService implements QueryService {
  /* Body params of the source will be overridden by body params of the query */
  body(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object {
    const bodyToggle = queryOptions['body_toggle'];
    if (bodyToggle) {
      const jsonBody = queryOptions['json_body'];
      if (!jsonBody) return undefined;
      if (typeof jsonBody === 'string') return JSON5.parse(jsonBody);
      else return jsonBody;
    } else {
      const _body = (queryOptions.body || []).filter((o) => {
        return o.some((e) => !isEmpty(e));
      });

      if (!hasDataSource) return Object.fromEntries(_body);

      const bodyParams = _body.concat(sourceOptions.body || []);
      return Object.fromEntries(bodyParams);
    }
  }

  isJson(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  async run(
    sourceOptions: any,
    queryOptions: any,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<RestAPIResult> {
    /* REST API queries can be adhoc or associated with a REST API datasource */
    const hasDataSource = dataSourceId !== undefined;
    const isUrlEncoded = checkIfContentTypeIsURLenc(queryOptions['headers']);

    /* Prefixing the base url of datasource if datasource exists */
    const url = hasDataSource ? `${sourceOptions.url || ''}${queryOptions.url || ''}` : queryOptions.url;

    const method = queryOptions['method'];
    const json = method !== 'get' ? this.body(sourceOptions, queryOptions, hasDataSource) : undefined;
    const paramsFromUrl = urrl.parse(url, true).query;

    const _requestOptions: OptionsOfTextResponseBody = {
      method,
      ...this.fetchHttpsCertsForCustomCA(sourceOptions),
      headers: sanitizeHeaders(sourceOptions, queryOptions, hasDataSource),
      searchParams: {
        ...paramsFromUrl,
        ...sanitizeSearchParams(sourceOptions, queryOptions, hasDataSource),
      },
      ...(isUrlEncoded ? { form: json } : { json }),
    };

    const authValidatedRequestOptions = validateAndSetRequestOptionsBasedOnAuthType(
      sourceOptions,
      context,
      _requestOptions
    );
    const { status, data } = authValidatedRequestOptions;
    if (status === 'needs_oauth') return authValidatedRequestOptions;

    const requestOptions = data as OptionsOfTextResponseBody;

    let result = {};
    let requestObject = {};
    let responseObject = {};
    let responseHeaders = {};

    try {
      const response = await got(url, requestOptions);
      result = this.getResponse(response);
      requestObject = {
        requestUrl: response.request.requestUrl,
        method: response.request.options.method,
        headers: response.request.options.headers,
        params: urrl.parse(response.request.requestUrl, true).query,
      };

      responseObject = {
        body: response.body,
        statusCode: response.statusCode,
      };

      responseHeaders = response.headers;
    } catch (error) {
      console.error(
        `Error while calling REST API end point. status code: ${error?.response?.statusCode} message: ${error?.response?.body}`
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

    requestObject['headers'] = cleanSensitiveData(requestObject['headers'], ['authorization']);

    return {
      status: 'ok',
      data: result,
      request: requestObject,
      response: responseObject,
      responseHeaders,
    };
  }

  fetchHttpsCertsForCustomCA(sourceOptions: any) {
    let httpsParams: any = {};
    switch (sourceOptions.ssl_certificate) {
      case 'ca_certificate':
        httpsParams = {
          https: {
            certificateAuthority: [sourceOptions.ca_cert],
          },
        };
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
      default:
        break;
    }

    if (process.env.NODE_EXTRA_CA_CERTS) {
      'https' in httpsParams
        ? (httpsParams.https.certificateAuthority = httpsParams.https?.certificateAuthority.concat([
            ...tls.rootCertificates,
            readFileSync(process.env.NODE_EXTRA_CA_CERTS),
          ]))
        : (httpsParams = {
            https: {
              certificateAuthority: [...tls.rootCertificates, readFileSync(process.env.NODE_EXTRA_CA_CERTS)].join('\n'),
            },
          });
    }

    return httpsParams;
  }

  private getResponse(response) {
    try {
      if (this.isJson(response.body)) {
        return JSON.parse(response.body);
      }
      if (response.rawBody && response.headers?.['content-type']?.startsWith('image/')) {
        return Buffer.from(response.rawBody, 'binary').toString('base64');
      }
    } catch (error) {
      console.error('Error while parsing response', error);
    }
    return response.body;
  }

  checkIfContentTypeIsURLenc(headers: [] = []) {
    const objectHeaders = Object.fromEntries(headers);
    const contentType = objectHeaders['content-type'] ?? objectHeaders['Content-Type'];
    return contentType === 'application/x-www-form-urlencoded';
  }

  authUrl(sourceOptions: SourceOptions): string {
    return getAuthUrl(sourceOptions);
  }

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
