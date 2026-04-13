import { QueryError, QueryService, OAuthUnauthorizedClientError, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, QueryResult } from './types';
import got from 'got';

const BASE_URL = 'https://quickbooks.api.intuit.com';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export default class QuickBooks implements QueryService {
  authUrl(source_options: SourceOptions): string {
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;

    const clientId = source_options?.client_id?.value;

    if (!clientId) {
      const errorMessage = 'Missing OAuth credentials: "client_id" not provided.';
      const errorDetails = {
        message: errorMessage,
        name: 'InvalidConfigurationError',
        code: 'MISSING_OAUTH_CREDENTIALS',
        missing: { clientId: true },
      };
      throw new QueryError('Invalid configuration', errorMessage, errorDetails);
    }

    const scope = encodeURIComponent(source_options?.scopes?.value || '');
    const redirectUri = `${fullUrl}oauth2/authorize`;

    return (
      `https://appcenter.intuit.com/connect/oauth2?response_type=code&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}&scope=${scope}&access_type=offline`
    );
  }

  private getBasicAuthHeader(clientId: string, clientSecret: string): string {
    return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  }

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const getOption = (key: string) =>
      Array.isArray(source_options) ? source_options.find((item: any) => item.key === key)?.value : source_options?.[key];

    const clientId = getOption('client_id');
    const clientSecret = getOption('client_secret');
    const redirectUri = `${process.env.TOOLJET_HOST}${process.env.SUB_PATH || '/'}oauth2/authorize`;

    const data = new URLSearchParams({
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    try {
      const response = await got(TOKEN_URL, {
        method: 'post',
        headers: {
          Authorization: this.getBasicAuthHeader(clientId, clientSecret),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
        responseType: 'json',
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
      const errorMessage = parsed?.error || error?.message || 'Failed to exchange token with QuickBooks';
      const errorDetails = {
        message: errorMessage,
        name: 'QuickBooksTokenExchangeError',
        code: parsed?.code || 'QUICKBOOKS_TOKEN_EXCHANGE_FAILED',
      };
      throw new QueryError('Failed to retrieve access tokens', errorMessage, errorDetails);
    }
  }

  async refreshToken(sourceOptions: any, dataSourceId?: string, userId?: string, isAppPublic?: boolean) {
    const refreshTokenValue = sourceOptions['refresh_token'];

    if (!refreshTokenValue) {
      const errorMessage = 'Missing OAuth refresh_token in source options';
      const errorDetails = {
        message: errorMessage,
        name: 'UnauthorizedError',
        code: 'MISSING_REFRESH_TOKEN',
        missing: { refresh_token: true },
      };
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    const clientId = sourceOptions.client_id;
    const clientSecret = sourceOptions.client_secret;

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    });

    try {
      const response = await got(TOKEN_URL, {
        method: 'post',
        headers: {
          Authorization: this.getBasicAuthHeader(clientId, clientSecret),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
        responseType: 'json',
      });

      const result = response.body as { access_token?: string; refresh_token?: string };

      if (result.access_token) {
        return {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        };
      } else {
        const errorMessage = 'Access token not found in QuickBooks response';
        const errorDetails = {
          response: result,
          status: response.statusCode,
        };
        throw new QueryError('QuickBooksTokenError', errorMessage, errorDetails);
      }
    } catch (error: any) {
      let parsed: any;

      try {
        parsed = error?.response?.body ? JSON.parse(error.response.body) : error;
      } catch {
        parsed = error?.response?.body || error;
      }

      const errorMessage =
        parsed?.error_description || parsed?.error || error?.message || 'QuickBooks token refresh failed';

      const errorDetails = {
        status: error?.response?.statusCode || null,
        response: parsed,
      };
      throw new QueryError('QuickBooksTokenRefreshError', errorMessage, errorDetails);
    }
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    const accessToken = sourceOptions['access_token'];
    const companyId = sourceOptions['company_id']?.value || sourceOptions['company_id'];

    const operation = queryOptions?.operation?.toLowerCase?.();
    const path = queryOptions['path'];
    const pathParams = queryOptions['params']?.['path'] || {};
    const queryParams = queryOptions['params']?.['query'] || {};
    const bodyParams = queryOptions['params']?.['request'] || {};

    // Build URL, replacing path params
    let url = `${BASE_URL}${path}`;
    for (const param in pathParams) {
      url = url.replace(`{${param}}`, encodeURIComponent(pathParams[param]));
    }

    // Replace {companyid} with the company_id from sourceOptions
    if (companyId) {
      url = url.replace('{companyid}', encodeURIComponent(companyId));
    }

    const requestOptions: any = {
      method: operation,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    };

    // Add query params
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            (value as any[]).forEach((v) => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      requestOptions.searchParams = searchParams;
    }

    // Add body for non-GET/DELETE operations
    if (operation && !['get', 'delete'].includes(operation)) {
      if (bodyParams && Object.keys(bodyParams).length > 0) {
        requestOptions.json = bodyParams;
      }
    }

    try {
      const response = await got(url, requestOptions);
      const result = response.body ? JSON.parse(response.body) : 'Query Success';
      return {
        status: 'ok',
        data: result,
      };
    } catch (error: any) {
      const statusCode =
        error.response?.statusCode ||
        error.description?.statusCode ||
        error.data?.statusCode ||
        error.statusCode ||
        error.data?.response?.statusCode ||
        error.data?.error?.statusCode ||
        error.data?.error?.response?.statusCode;

      if (statusCode === 401 || statusCode === 403) {
        throw new OAuthUnauthorizedClientError('OAuth token expired or invalid', error.message, error);
      }

      let parsed;
      try {
        parsed = error?.response?.body ? JSON.parse(error.response.body) : error;
      } catch {
        parsed = error?.response?.body || error;
      }

      const errorMessage =
        parsed?.Fault?.Error?.[0]?.Detail ||
        parsed?.Fault?.Error?.[0]?.Message ||
        parsed?.message ||
        'QuickBooks API request failed';

      const errorDetails = {
        statusCode: error?.response?.statusCode,
        fault: parsed?.Fault,
        message: parsed?.message || parsed,
        code: error?.code,
      };

      throw new QueryError('Query execution failed', errorMessage, errorDetails);
    }
  }

  async testConnection(sourceOptions: any): Promise<ConnectionTestResult> {
    const accessToken = sourceOptions['access_token'];
    const companyId = sourceOptions['company_id']?.value || sourceOptions['company_id'];

    if (!accessToken) {
      return { status: 'failed', message: 'Access token is missing. Please authenticate with QuickBooks.' };
    }

    if (!companyId) {
      return { status: 'failed', message: 'Company ID is missing. Please provide a valid Company ID.' };
    }

    try {
      await got(`${BASE_URL}/v3/company/${encodeURIComponent(companyId)}/companyinfo/${encodeURIComponent(companyId)}`, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      return { status: 'ok' };
    } catch (error: any) {
      const statusCode = error?.response?.statusCode;
      let errorMessage = 'Failed to connect to QuickBooks';

      if (statusCode === 401 || statusCode === 403) {
        errorMessage = 'OAuth token expired or invalid. Please re-authenticate.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return { status: 'failed', message: errorMessage };
    }
  }
}
