const urrl = require('url');
import { readFileSync } from 'fs';
import * as tls from 'tls';
import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import got, { Headers, HTTPError } from 'got';

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

interface RestAPIResult extends QueryResult {
  request?: Array<object> | object;
  response?: Array<object> | object;
  responseHeaders?: Array<object> | object;
}

export default class RestapiQueryService implements QueryService {
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

  /* Body params of the source will be overridden by body params of the query */
  body(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object {
    const _body = (queryOptions.body || []).filter((o) => {
      return o.some((e) => !isEmpty(e));
    });

    if (!hasDataSource) return Object.fromEntries(_body);

    const bodyParams = _body.concat(sourceOptions.body || []);
    return Object.fromEntries(bodyParams);
  }

  /* Search params of the source will be overridden by Search params of the query */
  searchParams(sourceOptions: any, queryOptions: any, hasDataSource: boolean): object {
    const _urlParams = (queryOptions.url_params || []).filter((o) => {
      return o.some((e) => !isEmpty(e));
    });

    if (!hasDataSource) return Object.fromEntries(_urlParams);

    const urlParams = _urlParams.concat(sourceOptions.url_params || []);
    return Object.fromEntries(urlParams);
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<RestAPIResult> {
    /* REST API queries can be adhoc or associated with a REST API datasource */
    const hasDataSource = dataSourceId !== undefined;
    const requiresOauth = sourceOptions['auth_type'] === 'oauth2';

    const headers = this.headers(sourceOptions, queryOptions, hasDataSource);
    const customQueryParams = sanitizeCustomParams(sourceOptions['custom_query_params']);

    /* Chceck if OAuth tokens exists for the source if query requires OAuth */
    if (requiresOauth) {
      const tokenData = sourceOptions['tokenData'];

      if (!tokenData) {
        const tooljetHost = process.env.TOOLJET_HOST;
        const authUrl = new URL(
          `${sourceOptions['auth_url']}?response_type=code&client_id=${sourceOptions['client_id']}&redirect_uri=${tooljetHost}/oauth2/authorize&scope=${sourceOptions['scopes']}`
        );
        Object.entries(customQueryParams).map(([key, value]) => authUrl.searchParams.append(key, value));

        return {
          status: 'needs_oauth',
          data: { auth_url: authUrl },
        };
      } else {
        const accessToken = tokenData['access_token'];
        if (sourceOptions['add_token_to'] === 'header') {
          const headerPrefix = sourceOptions['header_prefix'];
          headers['Authorization'] = `${headerPrefix}${accessToken}`;
        }
      }
    }

    let result = {};
    let requestObject = {};
    let responseObject = {};
    let responseHeaders = {};

    /* Prefixing the base url of datasouce if datasource exists */
    const url = hasDataSource ? `${sourceOptions.url}${queryOptions.url || ''}` : queryOptions.url;

    const method = queryOptions['method'];
    const json = method !== 'get' ? this.body(sourceOptions, queryOptions, hasDataSource) : undefined;
    const paramsFromUrl = urrl.parse(url, true).query;
    try {
      const response = await got(url, {
        method,
        headers,
        ...this.fetchHttpsCertsForCustomCA(),
        searchParams: {
          ...paramsFromUrl,
          ...this.searchParams(sourceOptions, queryOptions, hasDataSource),
        },
        json,
      });

      result = JSON.parse(response.body);
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
      console.log(error);

      if (error instanceof HTTPError) {
        result = {
          requestObject: {
            requestUrl: error.request.requestUrl,
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
      request: requestObject,
      response: responseObject,
      responseHeaders,
    };
  }

  /* This function fetches the access token from the token url set in REST API (oauth) datasource */
  async fetchOAuthToken(sourceOptions: any, code: string): Promise<any> {
    const tooljetHost = process.env.TOOLJET_HOST;
    const accessTokenUrl = sourceOptions['access_token_url'];

    const customParams = sanitizeCustomParams(sourceOptions['custom_auth_params']);

    const response = await got(accessTokenUrl, {
      method: 'post',
      json: {
        code,
        client_id: sourceOptions['client_id'],
        client_secret: sourceOptions['client_secret'],
        grant_type: sourceOptions['grant_type'],
        redirect_uri: `${tooljetHost}/oauth2/authorize`,
        ...this.fetchHttpsCertsForCustomCA(),
        ...customParams,
      },
    });

    const result = JSON.parse(response.body);
    return { access_token: result['access_token'] };
  }

  fetchHttpsCertsForCustomCA() {
    if (!process.env.NODE_EXTRA_CA_CERTS) return {};

    return {
      https: {
        certificateAuthority: [...tls.rootCertificates, readFileSync(process.env.NODE_EXTRA_CA_CERTS)].join('\n'),
      },
    };
  }

  checkIfContentTypeIsURLenc(headers: []) {
    const objectHeaders = Object.fromEntries(headers);
    const contentType = objectHeaders['content-type'] ?? objectHeaders['Content-Type'];
    return contentType === 'application/x-www-form-urlencoded';
  }

  async refreshToken(sourceOptions, error) {
    const refreshToken = sourceOptions['tokenData']['refresh_token'];
    if (!refreshToken) {
      throw new QueryError('Refresh token not found', error.response, {});
    }
    const accessTokenUrl = sourceOptions['access_token_url'];
    const clientId = sourceOptions['client_id'];
    const clientSecret = sourceOptions['client_secret'];
    const grantType = 'refresh_token';
    const isUrlEncoded = this.checkIfContentTypeIsURLenc(sourceOptions['headers']);

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      refresh_token: refreshToken,
    };

    const accessTokenDetails = {};

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        headers: {
          'Content-Type': isUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
        },
        form: isUrlEncoded ? data : undefined,
        json: !isUrlEncoded ? data : undefined,
      });
      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 || response.statusCode < 300)) {
        throw new QueryError('could not connect to Oauth server', error.response, {});
      }

      if (result['access_token']) {
        accessTokenDetails['access_token'] = result['access_token'];
        accessTokenDetails['refresh_token'] = refreshToken;
      }
    } catch (error) {
      console.log(error.response.body);
      throw new QueryError('could not connect to Oauth server', error.response, {});
    }
    return accessTokenDetails;
  }
}
