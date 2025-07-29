import {
  QueryError,
  QueryService,
  User,
  App,
  validateAndSetRequestOptionsBasedOnAuthType,
} from '@tooljet-marketplace/common';
import { SourceOptions, ConvertedFormat, QueryResult, } from './types';
import got, { Headers, OptionsOfTextResponseBody } from 'got';


export default class Xero implements QueryService {
  
  authUrl(source_options: SourceOptions): string {
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const oauth_type = source_options.oauth_type?.value;

    let clientId: string;
    let clientSecret: string;

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.XERO_CLIENT_ID;
      clientSecret = process.env.XERO_CLIENT_SECRET;

    } else {
      clientId = source_options?.client_id?.value;
      clientSecret = source_options?.client_secret?.value;
    }

    const scope = 'openid profile email offline_access accounting.transactions accounting.contacts';

    if (!clientId || !clientSecret) {
      throw new Error(`Xero OAuth "clientId" or "clientSecret" is missing`);
    }

    const encodedScope = encodeURIComponent(scope);
     const baseUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}` +
       `&redirect_uri=${fullUrl}oauth2/authorize`;

    return `${baseUrl}&scope=${encodedScope}&access_type=offline&prompt=consent`;
  }

  async run(sourceOptions: any,queryOptions: any,dataSourceId: string,dataSourceUpdatedAt: string,context?: { user?: User; app?: App }): Promise<QueryResult> {
    
    if (sourceOptions['oauth_type'] === 'tooljet_app') {
      sourceOptions['client_id'] = process.env.XERO_CLIENT_ID;
      sourceOptions['client_secret'] = process.env.XERO_CLIENT_SECRET;
    }
    
    const accessToken = sourceOptions['access_token'];
    const tenant_id = sourceOptions['tenant_id'];
    const operation = queryOptions.operation;
    const path = queryOptions['path'];
    const pathParams = queryOptions['params']?.['path'] || {};
    const queryParams = queryOptions['params']?.['query'] || {};
    const bodyParams = queryOptions['params']?.['request'] || {};

   let url = `https://api.xero.com/api.xro/2.0${path}`;
    for (const param in pathParams) {
      url = url.replace(`{${param}}`, pathParams[param]);
    }

    let requestOptions;

    if (sourceOptions['multiple_auth_enabled']) {
      const customHeaders = { 'tj-x-forwarded-for': '::1' };
      const newSourceOptions = this.constructSourceOptions(sourceOptions);
      const authValidatedRequestOptions = this.convertQueryOptions(queryOptions, customHeaders);

      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourceOptions,
        context,
        authValidatedRequestOptions as any
      );

      if (_requestOptions.status === 'needs_oauth') return _requestOptions;
      requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
    } else {
      requestOptions = {
        method: operation,
        headers: this.authHeader(accessToken, tenant_id),
        searchParams: queryParams,
      };

      if (!['get', 'delete'].includes(operation)) {
        requestOptions['json'] = bodyParams;
      }
    }

    try {
      const response = await got(url, requestOptions);
      const result = response.body ? JSON.parse(response.body) : 'Query Success';
      console.log('----------------------------------------------------------------------------->[Xero Plugin Response]', result);
      return {
        status: 'ok',
        data: result,
      };
    } catch (error) {
      console.error('[Xero Plugin Error]', error.response?.body);
      console.error('[Xero Plugin Error]', error);
      throw new QueryError('Query failed', error.message, error?.data || {});
    }
  }

  authHeader(token: string, tenant_id?: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Xero-Tenant-Id': tenant_id || '',
      'Content-Type': 'application/json',
    };
  }

  private convertQueryOptions(queryOptions: any, customHeaders?: Record<string, string>): any {
    const { operation, params } = queryOptions;
    const result: ConvertedFormat = {
      method: operation.toLowerCase(),
      headers: customHeaders || {},
    };

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

  private constructSourceOptions(sourceOptions: any) {
    return {
      ...sourceOptions,
      url: 'https://api.xero.com',
      auth_url: 'https://login.xero.com/identity/connect/authorize',
      access_token_url: 'https://identity.xero.com/connect/token',
      add_token_to: 'header',
      header_prefix: 'Bearer ',
      audience: '',
      client_auth: 'header',
      headers: [['', ''], ['tj-x-forwarded-for', '::1']],
      custom_query_params: [['', '']],
      custom_auth_params: [['', '']],
      access_token_custom_headers: [['', '']],
      ssl_certificate: 'none',
      retry_network_errors: true,
      scopes: encodeURIComponent('openid profile email accounting.transactions accounting.settings'),
    };
  }

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const oauth_type = source_options.find((item) => item.key === 'oauth_type')?.value;
    const clientId = oauth_type === 'tooljet_app'
      ? process.env.XERO_CLIENT_ID
      : source_options.find((item) => item.key === 'client_id')?.value;

    const clientSecret = oauth_type === 'tooljet_app'
      ? process.env.XERO_CLIENT_SECRET
      : source_options.find((item) => item.key === 'client_secret')?.value;

    const redirectUri = `${process.env.TOOLJET_HOST}${process.env.SUB_PATH || '/'}oauth2/authorize`;

    const data = new URLSearchParams({
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    try {
      const response = await got('https://identity.xero.com/connect/token', {
        method: 'post',
        body: data.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const tokenResponse = JSON.parse(response.body);

    //   const tenantsResponse = await got('https://api.xero.com/connections', {
    //     method: 'get',
    //     headers: this.authHeader(tokenResponse.access_token),
    //   });

    //   const tenantData = JSON.parse(tenantsResponse.body);

    //    const tenantId = tenantData?.[0]?.tenantId;

    //   const tenantList = tenantData.map((tenant) => [
    //     tenant.tenantId,
    //     tenant.tenantName || tenant.tenantId,
    //  ]);

    console.log('----------------------------------------------------------------------------->[Token Response]', tokenResponse);
    
      return [
        ['access_token', tokenResponse.access_token],
        ['refresh_token', tokenResponse.refresh_token],
      ];
    } catch (error) {
      console.error('[Xero OAuth Error]', error.response?.body);
      throw new Error('Could not connect to Xero OAuth token endpoint');
    }
  }

  async refreshToken(sourceOptions: any) {
    const refresh_token = sourceOptions['refresh_token'];
    if (!refresh_token) {
      throw new QueryError('Query could not be completed', 'Refresh token empty', {});
    }

    const data = new URLSearchParams({
      client_id: sourceOptions.client_id,
      client_secret: sourceOptions.client_secret,
      grant_type: 'refresh_token',
      refresh_token,
    });

    try {
      const response = await got('https://identity.xero.com/connect/token', {
        method: 'post',
        body: data.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const result = JSON.parse(response.body);

      if (result.access_token) {
        return {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        };
      } else {
        throw new QueryError('Access token not found in the response', '', {
          responseBody: response.body,
        });
      }
    } catch (error) {
      console.error('[Xero Refresh Token Error]', error.response?.body);
      throw new QueryError('Could not refresh Xero token', error.message, {});
    }
  }

}
