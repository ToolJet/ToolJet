import { QueryError, QueryService, OAuthUnauthorizedClientError } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, QueryResult } from './types';
import got from 'got';
import crypto from 'crypto';

const SANDBOX_URL = 'https://sandbox-quickbooks.api.intuit.com';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export default class QuickBooks implements QueryService {
  authUrl(source_options: SourceOptions): string {
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;

    const clientId = source_options?.client_id?.value;

    if (!clientId) {
      throw new QueryError(
        'Invalid configuration',
        'Missing OAuth credentials: "client_id" not provided.',
        { code: 'MISSING_OAUTH_CREDENTIALS' }
      );
    }

    const scope = encodeURIComponent(source_options?.scopes?.value || '');
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const state = crypto.randomUUID();

    return (
      `https://appcenter.intuit.com/connect/oauth2?response_type=code&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&access_type=offline`
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
      const parsed = error?.response?.body || error;
      const errorMessage = typeof parsed === 'object' ? (parsed?.error || JSON.stringify(parsed)) : (error?.message || 'Token exchange failed');
      console.error('[QuickBooks] Token exchange failed:', errorMessage, 'status:', error?.response?.statusCode);
      throw new QueryError('Failed to retrieve access tokens', errorMessage, { status: error?.response?.statusCode, response: parsed });
    }
  }

  async refreshToken(sourceOptions: any, dataSourceId?: string, userId?: string, isAppPublic?: boolean) {
    const refreshTokenValue = sourceOptions['refresh_token'];

    if (!refreshTokenValue) {
      throw new QueryError('Query could not be completed', 'Missing refresh_token', { code: 'MISSING_REFRESH_TOKEN' });
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
          refresh_token: result.refresh_token || refreshTokenValue, // preserve existing if not reissued
        };
      }

      throw new QueryError('QuickBooksTokenError', 'Access token not found in response', { response: result });
    } catch (error: any) {
      if (error instanceof QueryError) throw error;
      const parsed = error?.response?.body || error;
      const errorMessage = typeof parsed === 'object' ? (parsed?.error_description || parsed?.error || JSON.stringify(parsed)) : error?.message;
      console.error('[QuickBooks] Token refresh failed:', errorMessage);
      throw new QueryError('QuickBooksTokenRefreshError', errorMessage, { status: error?.response?.statusCode, response: parsed });
    }
  }

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    const accessToken = sourceOptions['access_token'];

    if (!accessToken) {
      throw new QueryError(
        'Authentication required',
        'No access token found. Please connect to QuickBooks first.',
        { code: 'MISSING_ACCESS_TOKEN' }
      );
    }

    const operation = queryOptions?.operation?.toLowerCase?.();
    const path = queryOptions['path'];
    const pathParams = queryOptions['params']?.['path'] || {};
    const queryParams = queryOptions['params']?.['query'] || {};
    const bodyParams = queryOptions['params']?.['request'] || {};

    // Build URL — always use sandbox for development apps
    let url = `${SANDBOX_URL}${path}`;
    for (const param in pathParams) {
      url = url.replace(`{${param}}`, encodeURIComponent(pathParams[param]));
    }

    console.log('[QuickBooks] Request:', operation?.toUpperCase(), url);

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
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        requestOptions.searchParams = searchParams;
      }
    }

    // Add body for non-GET/DELETE operations
    if (operation && !['get', 'delete'].includes(operation) && bodyParams && Object.keys(bodyParams).length > 0) {
      // QuickBooks /query endpoint expects a raw SQL string as text/plain, not JSON
      if (path?.endsWith('/query')) {
        const queryString = bodyParams['body'] ?? Object.values(bodyParams)[0];
        requestOptions.body = String(queryString);
        requestOptions.headers['Content-Type'] = 'text/plain';
      } else {
        const parsedBody: Record<string, any> = {};
        for (const [key, value] of Object.entries(bodyParams)) {
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (
              (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
              (trimmed.startsWith('[') && trimmed.endsWith(']'))
            ) {
              try {
                parsedBody[key] = JSON.parse(trimmed);
                continue;
              } catch {
                // not valid JSON, fall through
              }
            }
          }
          parsedBody[key] = value;
        }
        requestOptions.json = parsedBody;
      }
    }

    try {
      const response = await got(url, requestOptions);
      const result = response.body ? JSON.parse(response.body) : 'Query Success';
      return { status: 'ok', data: result };
    } catch (error: any) {
      const statusCode = error?.response?.statusCode;

      console.error('[QuickBooks] API error:', statusCode, error?.response?.body?.substring?.(0, 500) || error?.message);

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
        error?.message ||
        'QuickBooks API request failed';

      throw new QueryError('Query execution failed', errorMessage, {
        statusCode,
        fault: parsed?.Fault,
        code: error?.code,
      });
    }
  }
}
