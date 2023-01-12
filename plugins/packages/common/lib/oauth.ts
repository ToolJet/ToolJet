import got, { HTTPError } from 'got';
import urrl from 'url';
import { QueryError, OAuthUnauthorizedClientError } from './query.error';
import { getCurrentToken } from './utils.helper';

export function checkIfContentTypeIsURLenc(headers: [] = []) {
  const objectHeaders = Object.fromEntries(headers);
  const contentType = objectHeaders['content-type'] ?? objectHeaders['Content-Type'];
  return contentType === 'application/x-www-form-urlencoded';
}

export function sanitizeCustomParams(customArray: any) {
  const params = Object.fromEntries(customArray ?? []);
  Object.keys(params).forEach((key) => (params[key] === '' ? delete params[key] : {}));
  return params;
}

export const getRefreshedToken = async (sourceOptions: any, error: any, userId: string, isAppPublic: boolean) => {
  let refreshToken: string;
  if (sourceOptions && 'multiple_auth_enabled' in sourceOptions) {
    const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
    const currentToken = getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic);
    refreshToken = currentToken['refresh_token'];
  } else {
    refreshToken = sourceOptions['tokenData']['refresh_token'];
  }

  if (!refreshToken) {
    throw new QueryError('Refresh token not found', error.response, {});
  }
  const accessTokenUrl = sourceOptions['access_token_url'];
  const clientId = sourceOptions['client_id'];
  const clientSecret = sourceOptions['client_secret'];
  const grantType = 'refresh_token';
  const isUrlEncoded = checkIfContentTypeIsURLenc(sourceOptions['access_token_custom_headers']);
  const customAccessTokenHeaders = sanitizeCustomParams(sourceOptions['access_token_custom_headers']);

  const data = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: grantType,
    refresh_token: refreshToken,
  };

  const accessTokenDetails = {};
  let result: any, response: any;

  try {
    response = await got(accessTokenUrl, {
      method: 'post',
      headers: {
        'Content-Type': isUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
        ...customAccessTokenHeaders,
      },
      form: isUrlEncoded ? data : undefined,
      json: !isUrlEncoded ? data : undefined,
    });
    result = JSON.parse(response.body);
  } catch (error) {
    console.error(
      `Error while REST API refresh token call. Status code : ${error.response?.statusCode}, Message : ${error.response?.body}`
    );
    if (error instanceof HTTPError) {
      result = {
        requestObject: {
          requestUrl: error.request?.requestUrl,
          requestHeaders: error.request?.options?.headers,
          requestParams: urrl.parse(error.request?.requestUrl, true).query,
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
};
