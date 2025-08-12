import {
  QueryError,
  QueryResult,
  QueryService,
  User,
  App,
  validateAndSetRequestOptionsBasedOnAuthType,
} from '@tooljet-marketplace/common';
import { SourceOptions, ConvertedFormat } from './types';
import got, { OptionsOfTextResponseBody, Headers } from 'got';

export default class Microsoft_graph implements QueryService {
  authUrl(source_options: SourceOptions) {
    const { clientId, clientSecret, scopes, tenantId, redirectUri } = this.getOAuthCredentials(source_options);

    if (!clientId) {
      throw new Error('Client Id is required');
    }
    if (!clientSecret) {
      throw new Error('Client Secret is required');
    }
    if (!scopes) {
      throw new Error('Scope is required');
    }
    if (!tenantId) {
      throw new Error('Tenant is required');
    }

    const authState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes,
      state: authState,
    });

    const baseUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;

    return `${baseUrl}?${params.toString()}`;
  }

  async accessDetailsFrom(authCode: string, source_options): Promise<object> {
    const { clientId, clientSecret, tenantId, scopes, redirectUri } = this.getOAuthCredentials(source_options);
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const tokenRequestBody = {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes,
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
      const response = await got(tokenEndpoint, {
        method: 'post',
        headers,
        form: tokenRequestBody,
      });

      const tokenData = JSON.parse(response.body);
      const authDetails = [];

      if (tokenData.access_token) {
        authDetails.push(['access_token', tokenData.access_token]);
      }
      if (tokenData.refresh_token) {
        authDetails.push(['refresh_token', tokenData.refresh_token]);
      }
      if (tokenData.expires_in) {
        authDetails.push(['expires_in', tokenData.expires_in.toString()]);
      }
      if (tokenData.token_type) {
        authDetails.push(['token_type', tokenData.token_type]);
      }
      if (tokenData.scope) {
        authDetails.push(['scope', tokenData.scope]);
      }

      return authDetails;
    } catch (error) {
      throw new QueryError('Authorization Error', error.message, { error: error });
    }
  }

  async run(
    sourceOptions: any,
    queryOptions: any,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    let result = {};
    if (sourceOptions['oauth_type'] === 'tooljet_app') {
      sourceOptions['client_id'] = process.env.MICROSOFT_CLIENT_ID;
      sourceOptions['client_secret'] = process.env.MICROSOFT_CLIENT_SECRET;
    }
    const operation = queryOptions.operation;
    const accessToken = sourceOptions['access_token'];
    const baseUrl = 'https://graph.microsoft.com/v1.0';
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
      const newSourcOptions = this.constructSourceOptions(sourceOptions);
      const authValidatedRequestOptions = this.convertQueryOptions(queryOptions, customHeaders);

      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourcOptions,
        context,
        authValidatedRequestOptions as any,
        { kind: 'microsoft_graph' }
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
      if (error.response && error.response.body) {
        try {
          result = JSON.parse(error.response.body);
        } catch (parseError) {
          result = error.response.body;
        }
        const message = result?.['error']?.['message'];
        throw new QueryError('Query could not be completed', message, result || {});
      } else {
        const errorMessage = error?.message === 'Query could not be completed' ? error?.description : error?.message;
        throw new QueryError('Query could not be completed', errorMessage, error || {});
      }
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

  private constructSourceOptions(sourceOptions) {
    const baseUrl = 'https://graph.microsoft.com/v1.0';
    const tenantId = sourceOptions['tenant_id'] || 'common';
    const accessTokenUrl = sourceOptions['access_token_url'];
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
    const scope = 'https://graph.microsoft.com/.default';

    const addSourceOptions = {
      url: baseUrl,
      auth_url: authUrl,
      add_token_to: 'header',
      header_prefix: 'Bearer ',
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
      access_token_custom_headers: [['', '']],
      ssl_certificate: 'none',
      retry_network_errors: true,
      scopes: this.encodeOAuthScope(scope),
    };

    const newSourceOptions = {
      ...sourceOptions,
      ...addSourceOptions,
    };

    return newSourceOptions;
  }

  private encodeOAuthScope(scope: string): string {
    return encodeURIComponent(scope);
  }

  private convertQueryOptions(queryOptions: any, customHeaders?: Record<string, string>): any {
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
      clientId = process.env.MICROSOFT_CLIENT_ID;
      clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    }

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    return { clientId, clientSecret, tenantId, accessTokenUrl, scopes, redirectUri };
  }
}
