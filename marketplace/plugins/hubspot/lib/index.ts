import {
  QueryError,
  QueryResult,
  QueryService,
  constructSourceOptions,
  convertQueryOptions,
  encodeOAuthScope,
  User,
  App,
  validateAndSetRequestOptionsBasedOnAuthType,
} from '@tooljet-marketplace/common';
import { SourceOptions } from './types';
import got, { Headers, OptionsOfTextResponseBody } from 'got';
import { AuthSourceDetails } from 'plugins/common/dist/types';

export default class Hubspot implements QueryService {
  async run(
    sourceOptions: any,
    queryOptions: any,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    let result = {};
    if (sourceOptions['oauth_type'] === 'tooljet_app') {
      sourceOptions['client_id'] = process.env.GOOGLE_CLIENT_ID;
      sourceOptions['client_secret'] = process.env.GOOGLE_CLIENT_SECRET;
    }
    const operation = queryOptions.operation;
    const accessToken = sourceOptions['access_token'];
    const baseUrl = 'https://api.hubapi.com';
    const path = queryOptions['path'];
    let url = `${baseUrl}${path}`;
    const pathParams = queryOptions['params']['path'];
    const queryParams = queryOptions['params']['query'];
    const bodyParams = queryOptions['params']['request'];

    for (const param of Object.keys(pathParams)) {
      url = url.replace(`{${param}}`, pathParams[param]);
    }

    let requestOptions;
    if (sourceOptions['multiple_auth_enabled']) {
      const customHeaders = { 'tj-x-forwarded-for': '::1' };
      const authSourceDetails: AuthSourceDetails = {
        baseUrl: 'https://api.hubapi.com',
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        scope: sourceOptions.scopes,
        accessTokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        accessTokenCustomHeaders: [['Content-Type', 'application/x-www-form-urlencoded']],
      };
      const newSourcOptions = constructSourceOptions(sourceOptions, authSourceDetails);
      const authValidatedRequestOptions = convertQueryOptions(queryOptions, customHeaders);
      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourcOptions,
        context,
        authValidatedRequestOptions as any
      );
      if (_requestOptions.status === 'needs_oauth') return _requestOptions;
      requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
    } else {
      requestOptions =
        operation === 'get' || operation === 'delete'
          ? {
              method: operation,
              headers: this.authHeader(accessToken),
              searchParams: queryParams,
            }
          : {
              method: operation,
              headers: this.authHeader(accessToken),
              json: bodyParams,
              searchParams: queryParams,
            };
    }
    try {
      const response = await got(url, requestOptions);
      if (response && response.body) {
        try {
          result = JSON.parse(response.body);
        } catch (parseError) {
          result = response.body;
        }
      } else {
        result = 'Query Success';
      }
    } catch (error) {
      const errorMessage = error?.message === 'Query could not be completed' ? error?.description : error?.message;
      throw new QueryError('Query could not be completed', errorMessage, error?.data || {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }
  authHeader(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  authUrl(source_options: SourceOptions): string {
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const oauth_type = source_options.oauth_type.value;
    let clientId: string;
    let clientSecret: string;
    const scope: string = source_options.scopes.value;

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.HUBSPOT_CLIENT_ID;
      clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    } else {
      clientId = source_options?.client_id?.value;
      clientSecret = source_options?.client_secret?.value;
    }

    if (!clientId) {
      throw new Error(
        `HubSpot OAuth "clientId" ${oauth_type === 'tooljet_app' ? 'environment variable' : 'config'} is missing`
      );
    }

    if (!clientSecret) {
      throw new Error(
        `HubSpot OAuth "clientSecret" ${oauth_type === 'tooljet_app' ? 'environment variable' : 'config'} is missing`
      );
    }

    if (!scope) {
      throw new Error(`HubSpot OAuth "scope" config is missing`);
    }

    const encodedScope = encodeOAuthScope(scope);
    const baseUrl =
      'https://app.hubspot.com/oauth/authorize' +
      `?response_type=code&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(fullUrl + 'oauth2/authorize')}`;
    const authUrl = `${baseUrl}&scope=${encodedScope}`;
    return authUrl;
  }

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    let clientId = '';
    let clientSecret = '';
    const oauth_type = source_options.find((item) => item.key === 'oauth_type')?.value;

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.HUBSPOT_CLIENT_ID;
      clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    } else {
      clientId = source_options.find((item) => item.key === 'client_id')?.value;
      clientSecret = source_options.find((item) => item.key === 'client_secret')?.value;
    }

    for (const item of source_options) {
      if (item.key === 'client_id') {
        clientId = item.value;
      }
      if (item.key === 'client_secret') {
        clientSecret = item.value;
      }
    }

    const accessTokenUrl = 'https://api.hubapi.com/oauth/v1/token';
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const grantType = 'authorization_code';

    const data = new URLSearchParams({
      grant_type: grantType,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: authCode,
    });

    const authDetails = [];

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        body: data.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw Error('could not connect to HubSpot');
      }

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }

      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      console.log(error.response?.body || error.message);
      throw Error('could not connect to HubSpot');
    }
    return authDetails;
  }
}
