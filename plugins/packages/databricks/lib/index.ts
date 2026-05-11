import {
  QueryError,
  QueryResult,
  QueryService,
  OAuthUnauthorizedClientError,
  App,
  User,
  ConnectionTestResult,
  getCurrentToken,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { DBSQLClient } from '@databricks/sql';
import IDBSQLSession from '@databricks/sql/dist/contracts/IDBSQLSession';
import IOperation from '@databricks/sql/dist/contracts/IOperation';
import got, { Headers } from 'got';
import Int64 from 'node-int64';

export default class Databricks implements QueryService {
  private getSourceOptionValue(source_options: any, key: string): string {
    const option = Array.isArray(source_options)
      ? source_options.find((item: any) => item.key === key)
      : source_options[key];

    if (Array.isArray(source_options)) {
      return option?.value || '';
    }
    return option?.value || option || '';
  }

  authUrl(source_options: SourceOptions): string {
    const workspaceHost = this.getSourceOptionValue(source_options, 'host');
    const clientId = this.getSourceOptionValue(source_options, 'client_id');

    if (!workspaceHost) {
      throw new Error('Databricks workspace host is required for OAuth');
    }
    if (!clientId) {
      throw new Error('Databricks OAuth Client ID is required');
    }

    const tooljetHost = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${tooljetHost}${subpath ? subpath : '/'}`;
    const scope = 'all-apis offline_access';

    return (
      `https://${workspaceHost}/oidc/v1/authorize` +
      `?response_type=code&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${fullUrl}oauth2/authorize` +
      `&scope=${encodeURIComponent(scope)}`
    );
  }

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const workspaceHost = this.getSourceOptionValue(source_options, 'host');
    const clientId = this.getSourceOptionValue(source_options, 'client_id');
    const clientSecret = this.getSourceOptionValue(source_options, 'client_secret');

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
    }

    const tokenUrl = `https://${workspaceHost}/oidc/v1/token`;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const data = {
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'all-apis offline_access',
    };

    const authDetails: [string, string][] = [];

    try {
      const response = await got(tokenUrl, {
        method: 'POST',
        form: data,
        headers: { Authorization: `Basic ${basicAuth}` },
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw new Error('could not connect to Databricks');
      }

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }

      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      console.log('OAuth error response:', error.response?.body);
      throw new Error('could not connect to Databricks');
    }

    return authDetails;
  }

  authHeader(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async refreshToken(sourceOptions: any, dataSourceId: string, userId: string, isAppPublic: boolean) {
    let refreshToken: string;

    const currentUserToken = sourceOptions['refresh_token']
      ? sourceOptions
      : getCurrentToken(sourceOptions['multiple_auth_enabled'], sourceOptions['tokenData'], userId, isAppPublic);

    if (currentUserToken && currentUserToken['refresh_token']) {
      refreshToken = currentUserToken['refresh_token'];
    } else {
      throw new OAuthUnauthorizedClientError(
        'could not connect to Databricks',
        'Refresh token not found. Please re-authenticate to continue.',
        {}
      );
    }

    const workspaceHost = sourceOptions['host'];
    const clientId = sourceOptions['client_id'];
    const clientSecret = sourceOptions['client_secret'];

    const tokenUrl = `https://${workspaceHost}/oidc/v1/token`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'all-apis offline_access',
    };

    const accessTokenDetails: Record<string, string> = {};

    try {
      const response = await got(tokenUrl, {
        method: 'POST',
        form: data,
        headers: { Authorization: `Basic ${basicAuth}` },
      });

      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 && response.statusCode < 300)) {
        throw new QueryError(
          'could not connect to Databricks',
          JSON.stringify({ statusCode: response?.statusCode, message: response?.body }),
          {}
        );
      }

      if (result['access_token']) {
        accessTokenDetails['access_token'] = result['access_token'];
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
    } catch (error) {
      console.error(
        `Error while Databricks refresh token call. Status code : ${error.response?.statusCode}, Message : ${error.response?.body}`
      );
      if (error.response?.statusCode === 401 || error.response?.statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error, {
          ...error,
        });
      }
      throw new QueryError(
        'could not connect to Databricks',
        JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
        {}
      );
    }

    return accessTokenDetails;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';

    if (authType === 'oauth2') {
      const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
      let accessToken: string;

      if (isMultiAuthEnabled) {
        const tokenData = sourceOptions['tokenData'];
        const firstToken = Array.isArray(tokenData) ? tokenData[0] : null;
        accessToken = firstToken?.access_token;
      } else {
        accessToken = sourceOptions['access_token'];
      }

      if (!accessToken) {
        throw new QueryError(
          'Connection could not be established',
          'Access token not found. Please authenticate via OAuth first.',
          {}
        );
      }
    }

    let result;
    const client = await this.getConnection(sourceOptions);
    const session: IDBSQLSession = await client.openSession();
    try {
      const queryOperation: IOperation = await session.executeStatement('SELECT 1', {
        runAsync: true,
        queryTimeout: new Int64(10000),
      });
      result = await queryOperation.fetchAll();
    } catch (error) {
      throw new Error('Error in connection: ' + error.message);
    } finally {
      await session.close();
      await client.close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async getConnection(sourceOptions: SourceOptions, userId?: string, isAppPublic?: boolean): Promise<DBSQLClient> {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';
    let token: string;

    if (authType === 'oauth2') {
      const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
      let currentUserToken: any;

      if (isMultiAuthEnabled) {
        currentUserToken = getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic);
      } else {
        currentUserToken = sourceOptions;
      }

      const accessToken = currentUserToken?.['access_token'] || sourceOptions['access_token'];

      if (!accessToken) {
        throw new OAuthUnauthorizedClientError(
          'Authentication required',
          'Databricks access token not found. Please authenticate via OAuth first.',
          {}
        );
      }
      token = accessToken;
    } else {
      token = sourceOptions.personal_access_token;
    }

    const credentials: any = {
      host: sourceOptions.host,
      path: sourceOptions.http_path,
      token,
      socketTimeout: 60 * 1000,
    };

    try {
      const client = new DBSQLClient();
      client.connect(credentials);
      client.on('error', (error) => {
        console.error('Error in connection: ' + error.message);
      });
      return client;
    } catch (error) {
      throw new Error('Error in connection: ' + error.message);
    }
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const userId = context?.user?.id;
    const isAppPublic = context?.app?.isPublic;
    let result;
    const client = await this.getConnection(sourceOptions, userId, isAppPublic);
    const session: IDBSQLSession = await client.openSession();
    try {
      const queryOperation: IOperation = await session.executeStatement(queryOptions.sql_query, {
        runAsync: true,
        queryTimeout: new Int64(10000),
      });
      result = await queryOperation.fetchAll();
    } catch (error) {
      const statusCode = error.response?.statusCode || error.code || error.statusCode;
      const authType = sourceOptions['authentication_type'] || 'personal_access_token';

      if (authType === 'oauth2' && (statusCode === 401 || statusCode === 403)) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error.message, {});
      }

      throw new QueryError('Error fetching query result', error.message, {});
    } finally {
      await session.close();
      await client.close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
