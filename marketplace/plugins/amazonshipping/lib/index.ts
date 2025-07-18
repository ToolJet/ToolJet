import { QueryService, QueryResult, QueryError, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got from 'got';

export default class Amazonshipping implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const path = queryOptions.path;

    const pathParams = queryOptions.params?.path || {};
    const queryParams = queryOptions.params?.query || {};
    const bodyParams = queryOptions.params?.request || {};

    // console.log('----------------------------->Operation:----------------->', operation);
    // console.log('📍 Path:', path);
    // console.log('🔑 Path Params:', pathParams);
    // console.log('🔎 Query Params:', queryParams);
    // console.log('📦 Body Params:', bodyParams);

    return {
      status: 'ok',
      data: {
        message: `Operation '${operation}' received.`,
      }
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const {
      client_id,
      client_secret,
      authorization_code,
      redirect_uri
    } = sourceOptions;

    // console.log('🧪 Testing Connection...');
    // console.log('🔐 client_id:', client_id);
    // console.log('🔐 client_secret:', client_secret ? '****' : '(missing)');
    // console.log('📝 authorization_code:', authorization_code);
    // console.log('🔁 redirect_uri:', redirect_uri);

    if (!client_id || !client_secret || !authorization_code || !redirect_uri) {
      throw new QueryError(
        'Missing required OAuth credentials',
        'Ensure client_id, client_secret, authorization_code, and redirect_uri are provided',
        sourceOptions
      );
    }

    const tokenUrl = 'https://api.amazon.com/auth/o2/token';

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorization_code,
      client_id,
      client_secret,
      redirect_uri,
    });

    try {
      const response = await got.post(tokenUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        responseType: 'json',
      });

      const body = response.body as Record<string, unknown>;
      console.log('✅ Token Response:', body);

      const access_token = body['access_token'];

      if (!access_token || typeof access_token !== 'string') {
        throw new QueryError(
          'Access token not returned',
          'Amazon did not return a valid access token',
          body
        );
      }

      console.log('🔓 Access Token retrieved successfully');
      return {
        status: 'ok',
        message: 'OAuth connection successful. Access token retrieved.',
      };
    } catch (err: any) {
      console.error('Error retrieving token:', err.response?.body || err.message);
      throw new QueryError(
        'OAuth token exchange failed',
        err.response?.body?.error_description || err.message,
        err.response?.body || {}
      );
    }
  }
}
