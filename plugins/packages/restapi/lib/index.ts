const urrl = require('url');
import { readFileSync } from 'fs';
import * as tls from 'tls';
import {
  QueryError,
  QueryResult,
  QueryService,
  cleanSensitiveData,
  redactHeaders,
  User,
  App,
  OAuthUnauthorizedClientError,
  getRefreshedToken,
  isEmpty,
  validateAndSetRequestOptionsBasedOnAuthType,
  sanitizeHeaders,
  sanitizeCookies,
  cookiesToString,
  sanitizeSearchParams,
  getAuthUrl,
} from '@tooljet-plugins/common';
const FormData = require('form-data');
const JSON5 = require('json5');
import got, { HTTPError, OptionsOfTextResponseBody } from 'got';
import { SourceOptions } from './types';

function isFileObject(value) {
  const keys = Object.keys(value);

  return (
    typeof value === 'object' &&
    keys.length > 0 &&
    keys.includes('name') && // example.zip
    keys.includes('type') && // application/zip
    keys.includes('content') && // raw'ish bytes (contains new lines - \n)
    keys.includes('dataURL') && // data url representation
    keys.includes('base64Data') && // data in base64
    keys.includes('filePath')
  );
}

interface RestAPIResult extends QueryResult {
  metadata?: Array<object> | object;
}

export default class RestapiQueryService implements QueryService {
  async run(
    sourceOptions: any,
    queryOptions: any,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<RestAPIResult> {
    const hasDataSource = dataSourceId !== undefined;
    const url = this.constructUrl(sourceOptions, queryOptions, hasDataSource);
    const _requestOptions = await this.constructValidatedRequestOptions(
      context,
      sourceOptions,
      queryOptions,
      hasDataSource,
      url
    );

    if (_requestOptions.status === 'needs_oauth') return _requestOptions;
    const requestOptions = _requestOptions.data as OptionsOfTextResponseBody;

    try {
      const response = await got(url, requestOptions);
      const { result, requestObject, responseObject } = this.handleResponse(response);

      return {
        status: 'ok',
        data: result,
        metadata: {
          request: requestObject,
          response: responseObject,
        },
      };
    } catch (error) {
      throw this.handleError(error, sourceOptions);
    }
  }

  private async constructValidatedRequestOptions(
    context: { user?: User; app?: App },
    sourceOptions: any,
    queryOptions: any,
    hasDataSource: boolean,
    url: string
  ) {
    const headers = sanitizeHeaders(sourceOptions, queryOptions, hasDataSource);
    const method = queryOptions['method'];
    const searchParams = this.buildSearchParams(sourceOptions, queryOptions, hasDataSource, url);
    const _requestOptions: OptionsOfTextResponseBody = {
      method,
      ...this.fetchHttpsCertsForCustomCA(sourceOptions),
      headers,
      searchParams,
      ...(queryOptions['retry_network_errors'] === true ? {} : { retry: 0 }),
    };
    this.addCookiesToRequest(sourceOptions, queryOptions, hasDataSource, _requestOptions);

    const body = this.constructRequestBody(sourceOptions, queryOptions, hasDataSource);
    this.addBodyToRequest(_requestOptions, body);

    const authValidatedRequestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
      sourceOptions,
      context,
      _requestOptions
    );
    return authValidatedRequestOptions;
  }

  constructRequestBody(
    sourceOptions: any,
    queryOptions: any,
    hasDataSource: boolean
  ): undefined | string | Record<string, unknown> {
    if (queryOptions.method === 'get') return undefined;
    if (queryOptions['body_toggle']) {
      // FIXME: Remove json_body usage with data migration
      // For backward compatibility, check if JSON body was previously used
      queryOptions['raw_body'] ||= queryOptions['json_body'];
      return queryOptions['raw_body'];
    }

    const _body = (queryOptions.body || []).filter((o) => {
      return o.some((e) => !isEmpty(e));
    });
    // Body params of the source will be overridden by body params of the query
    if (!hasDataSource) return Object.fromEntries(_body);

    const bodyParams = _body.concat(sourceOptions.body || []);
    return Object.fromEntries(bodyParams);
  }

  isJson(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  private maybeParseJson(body: string): any {
    try {
      return JSON5.parse(body);
    } catch {
      return body;
    }
  }

  private constructUrl(sourceOptions: any, queryOptions: any, hasDataSource: boolean): string {
    return hasDataSource ? `${sourceOptions.url || ''}${queryOptions.url || ''}` : queryOptions.url;
  }

  private buildSearchParams(
    sourceOptions: any,
    queryOptions: any,
    hasDataSource: boolean,
    url: string
  ): URLSearchParams {
    const searchParams = new URLSearchParams();

    // Add URL parameters from source options
    for (const param of sourceOptions.url_parameters || []) {
      const [key, value] = param;
      if (key && value) {
        searchParams.append(key, value);
      }
    }

    const paramsFromUrl = urrl.parse(url, true).query;

    // Append parameters to preserve duplicates
    for (const [key, value] of Object.entries(paramsFromUrl)) {
      if (Array.isArray(value)) {
        value.forEach((val) => searchParams.append(key, val));
      } else {
        searchParams.append(key, String(value));
      }
    }

    // Sanitize and append search parameters
    for (const [key, value] of sanitizeSearchParams(sourceOptions, queryOptions, hasDataSource)) {
      searchParams.append(key, String(value));
    }

    return searchParams;
  }

  private addCookiesToRequest(
    sourceOptions: any,
    queryOptions: any,
    hasDataSource: boolean,
    requestOptions: OptionsOfTextResponseBody
  ) {
    const sanitizedCookies = sanitizeCookies(sourceOptions, queryOptions, hasDataSource);
    const cookieString = cookiesToString(sanitizedCookies);
    if (cookieString) {
      requestOptions.headers['Cookie'] = cookieString;
    }
  }

  private addBodyToRequest(requestOptions: OptionsOfTextResponseBody, body: any) {
    const headers = requestOptions.headers as Record<string, string>;
    const contentType = this.getContentType(headers);

    switch (contentType) {
      case 'application/json':
        requestOptions.json = this.maybeParseJson(body);
        break;
      case 'application/x-www-form-urlencoded':
        this.setFormUrlencodedBody(requestOptions, body);
        break;
      case 'multipart/form-data':
        this.setMultipartFormDataBody(requestOptions, body);
        break;
      default:
        requestOptions.body = body;
        break;
    }
  }

  private getContentType(headers: Record<string, string>): string {
    const contentTypeKey = Object.keys(headers).find((key) => key.toLowerCase() === 'content-type');
    return contentTypeKey ? headers[contentTypeKey].toLowerCase() : 'application/json';
  }

  private setFormUrlencodedBody(requestOptions: OptionsOfTextResponseBody, body: any) {
    typeof body === 'object' ? (requestOptions.form = body) : (requestOptions.body = body);
  }

  private setMultipartFormDataBody(requestOptions: OptionsOfTextResponseBody, body: any) {
    if (body && Object.values(body).some(isFileObject)) {
      const form = new FormData();
      Object.entries(body).forEach(([key, value]: [string, Record<string, string>]) => {
        if (isFileObject(value)) {
          const fileBuffer = Buffer.from(value.base64Data || '', 'base64');
          form.append(key, fileBuffer, {
            filename: value?.name || '',
            contentType: value?.type || '',
            knownLength: fileBuffer.length,
          });
        } else if (value != null) {
          form.append(key, value);
        }
      });
      requestOptions.body = form;
      requestOptions.headers = { ...requestOptions.headers, ...form.getHeaders() };
    }
  }

  private handleResponse(response: any) {
    const result = this.getResponse(response);
    const requestUrl = response?.request?.options?.url?.origin + response?.request?.options?.url?.pathname;
    const requestObject = {
      requestUrl,
      url: response.requestUrl,
      method: response.request.options.method,
      headers: redactHeaders(response.request.options.headers),
      params: urrl.parse(response.request.requestUrl, true).query,
    };

    const responseObject = {
      statusCode: response.statusCode,
      headers: redactHeaders(response.headers),
    };

    return { result, requestObject, responseObject };
  }

  private handleError(error: any, sourceOptions: any): Error {
    console.error(
      `Error while calling REST API endpoint. Status code: ${error?.response?.statusCode}, Message: ${error?.response?.body}`
    );

    let result = {};
    if (error instanceof HTTPError) {
      const requestUrl = error?.request?.options?.url?.origin + error?.request?.options?.url?.pathname;
      const requestHeaders = cleanSensitiveData(error?.request?.options?.headers, ['authorization']);
      result = {
        requestObject: {
          requestUrl,
          requestHeaders,
          requestParams: urrl.parse(error.request.requestUrl, true).query,
        },
        responseObject: {
          statusCode: error.response.statusCode,
          responseBody: error.response.body,
        },
        responseHeaders: error.response.headers,
      };
    }

    if (sourceOptions['auth_type'] === 'oauth2' && error?.response?.statusCode === 401) {
      throw new OAuthUnauthorizedClientError('Unauthorized status from API server', error.message, result);
    }
    throw new QueryError('Query could not be completed', error.message, result);
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

  authUrl(sourceOptions: SourceOptions): string {
    return getAuthUrl(sourceOptions);
  }

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
