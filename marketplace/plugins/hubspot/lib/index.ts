import {
  QueryError,
  QueryResult,
  QueryService,
  User,
  App,
  validateAndSetRequestOptionsBasedOnAuthType,
} from '@tooljet-marketplace/common';
import { SourceOptions, ConvertedFormat, AuthSourceDetails } from './types';
import got, { Headers, OptionsOfTextResponseBody } from 'got';

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
      sourceOptions['client_id'] = process.env.HUBSPOT_CLIENT_ID;
      sourceOptions['client_secret'] = process.env.HUBSPOT_CLIENT_SECRET;
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
      const newSourcOptions = this.constructSourceOptions(sourceOptions, authSourceDetails);
      const authValidatedRequestOptions = this.convertQueryOptions(queryOptions, customHeaders);
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
      const errorMessage = error.response.statusMessage ?? 'Query could not be completed';
      const errorResponse = {
        statusCode: error.response.statusCode,
        statusMessage: error.response.statusMessage,
        body: JSON.parse(error.response.body),
      };
      throw new QueryError('Query could not be completed', errorMessage, errorResponse || {});
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
    const { clientId, clientSecret, scopes, redirectUri } = this.getOAuthCredentials(source_options);
    const oauth_type = source_options.oauth_type.value;

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

    if (!scopes) {
      throw new Error(`HubSpot OAuth "scope" config is missing`);
    }

    const baseUrl = 'https://app.hubspot.com/oauth/authorize';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    return authUrl;
  }

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }
    const { clientId, clientSecret, redirectUri } = this.getOAuthCredentials(source_options);

    const accessTokenUrl = 'https://api.hubapi.com/oauth/v1/token';
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

  private normalizeSourceOptions(source_options: any): Record<string, any> {
    if (!Array.isArray(source_options)) {
      return source_options;
    }

    const normalized = {};
    source_options.forEach((item) => {
      normalized[item.key] = item.value;
    });
    return normalized;
  }

  private getOptionValue(option: any): any {
    if (option?.value !== undefined) {
      return option.value;
    }
    return option;
  }

  getOAuthCredentials(source_options: any) {
    const options = this.normalizeSourceOptions(source_options);
    const oauthType = this.getOptionValue(options.oauth_type);
    let clientId = this.getOptionValue(options.client_id);
    let clientSecret = this.getOptionValue(options.client_secret);
    const tenantId = this.getOptionValue(options.tenant_id);
    const accessTokenUrl = this.getOptionValue(options.access_token_url);
    const scopes = this.getOptionValue(options.scopes);

    if (oauthType === 'tooljet_app') {
      clientId = process.env.HUBSPOT_CLIENT_ID;
      clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    }

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    return { clientId, clientSecret, tenantId, accessTokenUrl, scopes, redirectUri };
  }

  constructSourceOptions = (sourceOptions, props: AuthSourceDetails) => {
    const baseUrl = props.baseUrl;
    const authUrl = props.authUrl;
    const scope = props.scope;
    const accessTokenUrl = props.accessTokenUrl;
    const headerPrefix = props.headerPrefix ? props.headerPrefix : 'Bearer ';
    const accessTokenCustomHeaders = props.accessTokenCustomHeaders ? props.accessTokenCustomHeaders : [['', '']];
    const addSourceOptions = {
      url: baseUrl,
      auth_url: authUrl,
      add_token_to: 'header',
      header_prefix: headerPrefix,
      access_token_url: accessTokenUrl,
      audience: '',
      username: '',
      password: '',
      bearer_token: '',
      client_auth: 'header',
      headers: [
        ['', ''],
        ['tj-x-forwarded-for', '::1'],
      ],
      custom_query_params: [['', '']],
      custom_auth_params: [['', '']],
      access_token_custom_headers: accessTokenCustomHeaders,
      ssl_certificate: 'none',
      retry_network_errors: true,

      scopes: this.encodeOAuthScope(scope),
    };
    const newSourcOptions = {
      ...sourceOptions,
      ...addSourceOptions,
    };
    return newSourcOptions;
  };

  encodeOAuthScope = (scope: string): string => {
    return encodeURIComponent(scope);
  };

  convertQueryOptions = (queryOptions: any, customHeaders?: Record<string, string>): any => {
    // Extract operation and params
    const { operation, params } = queryOptions;

    // Start building the result
    const result: ConvertedFormat = {
      method: operation.toLowerCase(),
      headers: customHeaders || {},
    };

    // Convert query params to URLSearchParams if they exist
    if (params.query && Object.keys(params.query).length > 0) {
      const urlParams = new URLSearchParams();

      Object.entries(params.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => urlParams.append(key, String(v)));
          } else {
            urlParams.append(key, String(value));
          }
        }
      });

      result.searchParams = urlParams;
    }

    if (!['get', 'delete'].includes(result.method) && params.request) {
      result.json = params.request;
    }

    return result;
  };
}
