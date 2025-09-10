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
    const oauth_type = source_options.oauth_type.value;

    let clientId: string;
    let clientSecret: string;

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.XERO_CLIENT_ID;
      clientSecret = process.env.XERO_CLIENT_SECRET;
    } else {
      clientId = source_options?.client_id?.value;
      clientSecret = source_options?.client_secret?.value;
    }

    if (!clientId || !clientSecret) {
      const errorMessage = 'Missing OAuth credentials: "clientId" or "clientSecret" not provided.';
      const errorDetails = {
        message: errorMessage,
        name: 'InvalidConfigurationError',
        code: 'MISSING_OAUTH_CREDENTIALS',
        missing: {
          clientId: !clientId,
          clientSecret: !clientSecret,
        },
      };
      throw new QueryError('Invalid configuration', errorMessage, errorDetails);
    }

    const scope = source_options?.scopes?.value;
    const encodedScope = encodeURIComponent(scope);
    const baseUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}` +
      `&redirect_uri=${fullUrl}oauth2/authorize`;

    return `${baseUrl}&scope=${encodedScope}&access_type=offline&prompt=consent`;
  }

  private convertQueryOptions(queryOptions: any, customHeaders?: Record<string, string>): any {
    if (!queryOptions || typeof queryOptions !== 'object') {
      const errorMessage = 'Expected queryOptions to be an object';
      const errorDetails = {
        message: errorMessage,
        name: 'InvalidQueryOptionsError',
        code: 'INVALID_QUERY_OPTIONS',
        received: queryOptions,
        expected: 'object',
      };
      throw new QueryError('Invalid configuration', errorMessage, errorDetails);
    }

    const { operation, params = {} } = queryOptions;
    const method = typeof operation === 'string' ? operation.toLowerCase() : 'get';
    const result: ConvertedFormat = {
      method,
      headers: customHeaders || {},
    };


    if (params?.query && Object.keys(params.query).length > 0) {
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

    if (!['get', 'delete'].includes(method) && params?.request && Object.keys(params.request).length > 0) {
      result.json = params.request;
    }
    return result;
  }

  private constructSourceOptions(sourceOptions: any) {
    const scope = sourceOptions[`scopes`];
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
      scopes: encodeURIComponent(scope)
    };
  }

  async refreshToken(sourceOptions: any) {
    const refresh_token = sourceOptions['refresh_token'];
    if (!refresh_token) {
      const errorMessage = 'Missing OAuth refresh_token in source options';
      const errorDetails = {
        message: errorMessage,
        name: 'UnauthorizedError',
        code: 'MISSING_REFRESH_TOKEN',
        missing: {
          refresh_token: true,
        },
      };
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
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
        form: data,
        responseType: 'json'
      });

      const result = response.body as { access_token?: string; refresh_token?: string };

      if (result.access_token) {
        return {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        };
      } else {
        const errorMessage = 'Access token not found in Xero response';
        const errorDetails = {
          response: result,
          status: response.statusCode,
        };
        throw new QueryError('XeroTokenError', errorMessage, errorDetails);
      }
    } catch (error: any) {
      let parsed: any;

      try {
        parsed = error?.response?.body ? JSON.parse(error.response.body) : error;
      } catch {
        parsed = error?.response?.body || error;
      }

      const errorMessage =
        parsed?.Title ||
        parsed?.error_description ||
        parsed?.error ||
        error?.message ||
        'Xero token refresh failed';

      const errorDetails = {
        status: error?.response?.statusCode || null,
        response: parsed,
      };
      throw new QueryError('XeroTokenRefreshError', errorMessage, errorDetails);
    }
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
        form: data,
        responseType: 'json'
      });

       const tokenResponse = response.body as { access_token: string; refresh_token: string };
       
       return [
         ['access_token', tokenResponse.access_token],
         ['refresh_token', tokenResponse.refresh_token],
       ];
    } catch (error: any) {
      let parsed;
      try {
        parsed = error?.response?.body ? JSON.parse(error.response.body) : error;
      } catch {
        parsed = error?.response?.body || error;
      }
      const errorMessage = parsed?.error || error?.message || 'Failed to exchange token with Xero';
      const errorDetails = {
        message: errorMessage,
        name: 'XeroTokenExchangeError',
        code: parsed?.code || 'XERO_TOKEN_EXCHANGE_FAILED',
      };
      throw new QueryError('Failed to retrieve access tokens', errorMessage, errorDetails);
    }
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string, dataSourceUpdatedAt: string, context?: { user?: User; app?: App }): Promise<QueryResult> {
    if (sourceOptions['oauth_type'] === 'tooljet_app') {
      sourceOptions['client_id'] = process.env.XERO_CLIENT_ID;
      sourceOptions['client_secret'] = process.env.XERO_CLIENT_SECRET;
    }

    const specType = queryOptions?.specType?.toLowerCase();
    const accessToken = sourceOptions['access_token'];
    const operation = queryOptions?.operation?.toLowerCase?.();
    const path = queryOptions['path'];
    const pathParams = queryOptions['params']['path'];
    const queryParams = queryOptions['params']['query'];
    const bodyParams = queryOptions['params']['request'];

    console.log(`------------------------------------>query Options`,queryOptions);
    let baseUrl: string;

    switch (specType.toLowerCase()) { 
      case "accounts":
      case "contacts":
      case "invoices":
      case "payments":
      case "reports":
        baseUrl = "https://api.xero.com/api.xro/2.0";
        break;
      case "finance":
        baseUrl = "https://api.xero.com/finance.xro/1.0";
        break;
      case "files":
        baseUrl = "https://api.xero.com/files.xro/1.0";
        break;
      case "identity":
        baseUrl = "https://api.xero.com";
        break;
      case "bank_feeds":
        baseUrl = "https://api.xero.com/bankfeeds.xro/1.0";
        break;
      case "projects":
        baseUrl = "https://api.xero.com/projects.xro/2.0";
        break;
      case "payroll_au":
        baseUrl = "https://api.xero.com/payroll.xro/1.0";
        break;
      case "payroll_uk":
        baseUrl = "https://api.xero.com/payroll.xro/2.0";
        break;
      case "payroll_nz":
        baseUrl = "https://api.xero.com/payroll.xro/2.0";
        break;
      case "app_store":
        baseUrl = "https://api.xero.com/appstore.xro/1.0";
        break;
      case "assets":
        baseUrl = "https://api.xero.com/assets.xro/1.0";
        break;

      default:
        throw new QueryError(`Unknown specType/entity: ${specType}`, `Unknown specType/entity: ${specType}`, {});
    }

    let url = `${baseUrl}${path}`;


    for (const param in pathParams) {
      url = url.replace(`{${param}}`, encodeURIComponent(pathParams[param]));
    }

    let requestOptions;
    if (sourceOptions['multiple_auth_enabled']) {
      const customHeaders = { 'tj-x-forwarded-for': '::1' };
      const newSourceOptions = this.constructSourceOptions(sourceOptions);
      const authValidatedRequestOptions = this.convertQueryOptions(queryOptions, customHeaders);

      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourceOptions,
        context,
        authValidatedRequestOptions as any,
        { kind: 'xero' }
      );
      if (_requestOptions.status === 'needs_oauth') return _requestOptions;
      requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
      requestOptions.headers = {
        ...(requestOptions.headers || {}),
       // 'Xero-tenant-id': sourceOptions['tenant_id'],
        'Xero-tenant-id': queryOptions?.tenant_id,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
    } else {
      requestOptions = {
        method: operation,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          //'Xero-tenant-id': sourceOptions['tenant_id'],
          'Xero-tenant-id': queryOptions?.tenant_id,
           Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        searchParams: queryParams,
      };

      // if (operation && typeof operation === 'string' && !['get', 'delete'].includes(operation)) {
      //   if (bodyParams && Object.keys(bodyParams).length > 0) {
      //     requestOptions['json'] = bodyParams;
      //   }
      // }
      if (operation && typeof operation === 'string' && !['get', 'delete'].includes(operation)) {
        if (specType === 'files' && operation === 'post') {
          requestOptions.headers['Content-Type'] = 'multipart/form-data';
          requestOptions.body = bodyParams?.body;
        } else if (bodyParams && Object.keys(bodyParams).length > 0) {
          requestOptions['json'] = bodyParams;
        }
      }
    }
    try {
      console.log(`------------------------tenant_id`, queryOptions?.tenant_id)
      console.log(`------------------------->url[]`,url);
      console.log(`------------------------->requestOptions[]`,requestOptions);
      const response = await got(url, requestOptions);
      const result = response.body ? JSON.parse(response.body) : 'Query Success';
      return {
        status: 'ok',
        data: result,
      };
    } catch (error: any) {
      let parsed;
      try {
        parsed = error?.response?.body ? JSON.parse(error.response.body) : error;
      } catch {
        parsed = error?.response?.body || error;
      }
      const errorMessage = parsed?.Message || parsed?.Title || parsed?.message ||'Xero API request failed';
      const errorDetails = {
        statusCode: error?.response?.statusCode,
        ErrorNumber: parsed?.ErrorNumber,
        Type: parsed?.Type ,
        Message: parsed?.Message || parsed?.message || parsed?.Detail || parsed,
        Detail: parsed?.Detail,
        code: error?.code,
        Instance : parsed?.Instance,
        modelState: parsed?.modelState
      };
      throw new QueryError('Query execution failed', errorMessage, errorDetails);
    }
  }
}

