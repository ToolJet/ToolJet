import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { HTTPError } from 'got';
import urrl from 'url';
import { readFileSync } from 'fs';
import * as tls from 'tls';
const { CookieJar } = require('tough-cookie');

interface RestAPIResult extends QueryResult {
  request?: Array<object> | object;
  response?: Array<object> | object;
  responseHeaders?: Array<object> | object;
}

function sanitizeCustomParams(customArray: any) {
  const params = Object.fromEntries(customArray ?? []);
  Object.keys(params).forEach((key) => (params[key] === '' ? delete params[key] : {}));
  return params;
}

export default class Openapi implements QueryService {
  resolvePathParams(params: any, path: string) {
    let newString = path;
    Object.entries(params).map(([key, value]) => {
      newString = newString.replace(`{${key}}`, value as any);
    });
    return newString;
  }

  sanitizeObject(params: any) {
    Object.keys(params).forEach((key) => (params[key] === '' ? delete params[key] : {}));
    return params;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<RestAPIResult> {
    const { host, path, operation, params } = queryOptions;
    const { header, query, request } = params;
    const pathParams = params.path;
    const authType = sourceOptions['auth_type'];
    const requiresOauth = authType === 'oauth2';
    const cookieJar = new CookieJar();

    const url = new URL(host + this.resolvePathParams(pathParams, path));
    const json = operation !== 'get' ? this.sanitizeObject(request) : undefined;
    const customQueryParams = sanitizeCustomParams(sourceOptions['custom_query_params']);

    let result = {};
    let requestObject = {};
    let responseObject = {};
    let responseHeaders = {};

    if (authType === 'bearer') {
      header['Authorization'] = `Bearer ${sourceOptions.bearer_token}`;
    }

    const resolveApiKeyParams = () => {
      const apiKeys = sourceOptions.api_keys;
      const auth_key = sourceOptions.auth_key;
      const processKey = (type: string, name: string, value: string) => {
        if (type === 'header') {
          header[name] = value;
        } else if (type === 'query') {
          url.searchParams.append(name, value);
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
    };

    if (authType === 'apiKey') {
      resolveApiKeyParams();
    }

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
