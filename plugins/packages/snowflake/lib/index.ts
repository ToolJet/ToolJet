import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  getAuthUrl,
  sanitizeParams,
  User,
  App,
  validateAndSetRequestOptionsBasedOnAuthType,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import * as snowflake from 'snowflake-sdk';
import got from 'got';

export default class Snowflake implements QueryService {
  async connExecuteAsync(connection: snowflake.Connection, options: any) {
    return new Promise((resolve, reject) => {
      connection.execute({
        ...options,
        complete: function (err, stmt, rows) {
          if (err) {
            reject(err);
          } else {
            resolve({ stmt, rows });
          }
        },
      });
    });
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const sqlText = queryOptions.query;
    const grantType = sourceOptions.grant_type;
    const authType = sourceOptions.auth_type;
    const multipleAuthEnabled = sourceOptions.multiple_auth_enabled;

    if (authType === 'oauth2' && grantType === 'authorization_code' && multipleAuthEnabled === true) {
      const authValidatedRequestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        sourceOptions,
        context,
        {},
        { kind: 'snowflake' }
      );
      if (authValidatedRequestOptions.status === 'needs_oauth') return authValidatedRequestOptions;
    }

    const connection: snowflake.Connection = await this.getConnection(
      sourceOptions,
      {},
      true,
      dataSourceId,
      dataSourceUpdatedAt,
      context
    );

    try {
      const result: any = await this.connExecuteAsync(connection, {
        sqlText,
      });

      return { status: 'ok', data: result.rows };
    } catch (err) {
      throw new QueryError('Query could not be completed', err.message, {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const connection = await this.getConnection(sourceOptions, {}, false);
    const isConnectionValid = await connection.isValidAsync();

    if (isConnectionValid) return { status: 'ok' };

    throw new Error('Connection is invalid');
  }

  async connAsync(connection: snowflake.Connection) {
    return new Promise((resolve, reject) => {
      connection.connect(function (err, conn) {
        if (err) reject(err);
        resolve(conn);
      });
    });
  }

  async buildConnection(sourceOptions: SourceOptions, context?) {
    const connectionConfig: any = {
      account: sourceOptions.account,
      warehouse: sourceOptions.warehouse,
      database: sourceOptions.database,
      schema: sourceOptions.schema,
      role: sourceOptions.role,
      clientSessionKeepAlive: true,
      clientSessionKeepAliveHeartbeatFrequency: 900,
    };

    if (sourceOptions.auth_type === 'oauth2') {
      let accessToken = sourceOptions.access_token;
      if (sourceOptions.multiple_auth_enabled && sourceOptions.tokenData) {
        if (Array.isArray(sourceOptions.tokenData) && sourceOptions.tokenData.length > 0) {
          const userTokenData = sourceOptions.tokenData.find((token) => token.user_id === context.user.id);
          if (!userTokenData) throw new Error('No token data for the particular UserId');
          accessToken = userTokenData.access_token;
        } else if (sourceOptions.tokenData.access_token) {
          accessToken = sourceOptions.tokenData.access_token;
        }
      }
      if (accessToken) {
        connectionConfig.accessToken = accessToken;
        connectionConfig.token = accessToken;
        connectionConfig.authenticator = 'OAUTH';
      } else {
        throw new QueryError('OAuth access token not found', 'Access token is required for OAuth authentication', {});
      }
    } else if (sourceOptions.auth_type === 'basic') {
      connectionConfig.password = sourceOptions.password;
      connectionConfig.username = sourceOptions.username;
    }

    const connection = snowflake.createConnection(connectionConfig);
    return await this.connAsync(connection);
  }

  authUrl(sourceOptions: SourceOptions): string {
    const modifiedOptions = { ...sourceOptions };

    Object.keys(sourceOptions).forEach((key) => {
      if (sourceOptions[key] && typeof sourceOptions[key] === 'object' && 'value' in sourceOptions[key]) {
        modifiedOptions[key] = sourceOptions[key].value;
      } else {
        modifiedOptions[key] = sourceOptions[key];
      }
    });

    if (modifiedOptions['oauth_type'] === 'tooljet_app') {
      modifiedOptions['client_id'] = process.env.SNOWFLAKE_CLIENT_ID;
    }
    return getAuthUrl(modifiedOptions);
  }

  async accessDetailsFrom(authCode: string, source_options, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }
    const oauth_type = source_options.find((item) => item.key === 'oauth_type')?.value;
    let client_id = '';
    let client_secret = '';

    if (oauth_type === 'tooljet_app') {
      client_id = process.env.SNOWFLAKE_CLIENT_ID;
      client_secret = process.env.SNOWFLAKE_CLIENT_SECRET;
    } else {
      client_id = source_options.find((item) => item.key === 'client_id')?.value;
      client_secret = source_options.find((item) => item.key === 'client_secret')?.value;
    }

    const access_token_url = source_options.find((item) => item.key === 'access_token_url')?.value;
    const client_auth = source_options.find((item) => item.key === 'client_auth')?.value;
    const custom_auth_params = sanitizeParams(source_options.find((item) => item.key === 'custom_auth_params')?.value);

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const tokenRequestBody = {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri,
      ...custom_auth_params,
    };

    const headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (client_auth === 'header') {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else {
      tokenRequestBody['client_id'] = client_id;
      tokenRequestBody['client_secret'] = client_secret;
    }

    try {
      const response = await got(access_token_url, {
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
      return authDetails;
    } catch (error) {
      throw new QueryError('Authorization Error', error.message, {});
    }
  }

  async getConnection(
    sourceOptions: any,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string,
    context?
  ): Promise<any> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      let connection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);

      if (connection && (await connection.isValidAsync())) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions, context);
        cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions, context);
    }
  }
}
