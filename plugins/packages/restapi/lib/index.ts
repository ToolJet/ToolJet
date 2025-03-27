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
  checkIfContentTypeIsURLenc,
  checkIfContentTypeIsMultipartFormData,
  checkIfContentTypeIsJson,
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
  /* Body params of the source will be overridden by body params of the query */
  body(sourceOptions: any, queryOptions: any, hasDataSource: boolean): any {
    const bodyToggle = queryOptions['body_toggle'];
    if (bodyToggle) {
      // Use the generalized raw body if provided; otherwise, fall back to the legacy raw JSON body
      const rawBody = queryOptions['raw_body'];
      if (!rawBody) {
        // For backward compatibility, check if JSON body was previously used
        // FIXME: Remove the code inside this if condition and return undefined once data migration is complete
        const jsonBody = queryOptions['json_body'];
        if (!jsonBody) return undefined;
        if (typeof jsonBody === 'string') return { key: 'json_body', value: JSON5.parse(jsonBody) };
        else return { key: 'json_body', value: jsonBody };
      } else {
        return { key: 'raw_body', value: rawBody };
      }
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
    const headers = sanitizeHeaders(sourceOptions, queryOptions, hasDataSource);
    const headerEntries = Object.entries(headers);
    const isUrlEncoded = checkIfContentTypeIsURLenc(headerEntries);
    const isMultipartFormData = checkIfContentTypeIsMultipartFormData(headerEntries);
    const isJson = checkIfContentTypeIsJson(headerEntries);

    /* Prefixing the base url of datasource if datasource exists */
    const url = hasDataSource ? `${sourceOptions.url || ''}${queryOptions.url || ''}` : queryOptions.url;

    const method = queryOptions['method'];
    const retryOnNetworkError = queryOptions['retry_network_errors'] === true;
    const _body = method !== 'get' ? this.body(sourceOptions, queryOptions, hasDataSource) : undefined;
    const paramsFromUrl = urrl.parse(url, true).query;
    const searchParams = new URLSearchParams();

    for (const param of sourceOptions.url_parameters || []) {
      const [key, value] = param;
      if (key && value) {
        searchParams.append(key, value);
      }
    }

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

    const _requestOptions: OptionsOfTextResponseBody = {
      method,
      ...this.fetchHttpsCertsForCustomCA(sourceOptions),
      headers,
      searchParams,
      ...(retryOnNetworkError ? {} : { retry: 0 }),
    };

    const sanitizedCookies = sanitizeCookies(sourceOptions, queryOptions, hasDataSource);
    const cookieString = cookiesToString(sanitizedCookies);
    if (cookieString) {
      _requestOptions.headers['Cookie'] = cookieString;
    }

    const hasFiles = (json) => {
      if (isEmpty(json)) return false;

      return Object.values(json || {}).some((item) => {
        return isFileObject(item);
      });
    };

    if (isUrlEncoded) {
      _requestOptions.form = _body;
    } else if (isMultipartFormData && hasFiles(_body)) {
      const form = new FormData();
      for (const key in _body) {
        const value = _body[key];
        if (isFileObject(value)) {
          const fileBuffer = Buffer.from(value?.base64Data || '', 'base64');
          form.append(key, fileBuffer, {
            filename: value?.name || '',
            contentType: value?.type || '',
            knownLength: fileBuffer.length,
          });
        } else if (value !== undefined && value !== null) {
          form.append(key, value);
        }
      }
      _requestOptions.body = form;
      _requestOptions.headers = { ..._requestOptions.headers, ...form.getHeaders() };
    } else if (_body && _body.key === 'json_body') {
      // For backward compatibility
      // FIXME: Remove this if condition once data migration is complete
      _requestOptions.json = _body.value;
    } else if (_body) {
      if (isJson) {
        _requestOptions.json = JSON5.parse(_body.value);
      } else {
        _requestOptions.body = _body.value;
      }
    }

    const authValidatedRequestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
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
    let metadata = {};

    try {
      const response = await got(url, requestOptions);
      result = this.getResponse(response);

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
        `Error while calling REST API end point. status code: ${error?.response?.statusCode} message: ${error?.response?.body}`
      );

      if (error instanceof HTTPError) {
        const requestUrl = error?.request?.options?.url?.origin + error?.request?.options?.url?.pathname;
        const requestHeaders = cleanSensitiveData(error?.request?.options?.headers, ['authorization']);

        requestObject = {
            requestUrl: requestUrl,
            requestHeaders: requestHeaders,
            requestParams: urrl.parse(error.request.requestUrl, true).query,
        };

        responseObject = {
          statusCode: error.response.statusCode,
          responseBody: error.response.body,
        }

        metadata = {
          request: requestObject,
          response: responseObject,
        };

        result = {
          requestObject: requestObject,
          responseObject: responseObject,
          responseHeaders: error.response.headers,
        };

      }

      if (sourceOptions['auth_type'] === 'oauth2' && error?.response?.statusCode == 401) {
        throw new OAuthUnauthorizedClientError('Unauthorized status from API server', error.message, result);
      }
      throw new QueryError('Query could not be completed', error.message, result, metadata);
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
    const contentType: string = response.headers?.['content-type'] ?? '';
    try {
      if (this.isJson(response.body)) {
        return JSON.parse(response.body);
      }
      if (response.rawBody && this.isBinary(contentType)) {
        return Buffer.from(response.rawBody, 'binary').toString('base64');
      }
    } catch (error) {
      console.error('Error while parsing response', error);
    }
    return response.body;
  }

  private isBinary(contentType: string) {
    const binaryPrefixes = ['application/', 'image/'];
    const binaryApplicationTypes = ['application/pdf', 'application/zip'];

    for (const binaryPrefix of binaryPrefixes) {
      if (contentType?.startsWith(binaryPrefix)) {
        if (binaryPrefix === 'application/') return binaryApplicationTypes.includes(contentType);
        return true;
      }
    }
    return false;
  }

  authUrl(sourceOptions: SourceOptions): string {
    return getAuthUrl(sourceOptions);
  }

  async refreshToken(sourceOptions: any, error: any, userId: string, isAppPublic: boolean) {
    return getRefreshedToken(sourceOptions, error, userId, isAppPublic);
  }
}
