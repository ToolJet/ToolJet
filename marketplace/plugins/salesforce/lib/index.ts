import { QueryError, QueryResult, QueryService, User, App, initializeOAuth } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import jsforce from 'jsforce';

export default class Salesforce implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    let result = {};
    const grantType = sourceOptions.grant_type;
    const authType = sourceOptions.auth_type;
    const multipleAuthEnabled = sourceOptions.multiple_auth_enabled;

    if (authType === 'oauth2' && grantType === 'authorization_code' && multipleAuthEnabled === true) {
      const authValidationResult = initializeOAuth(sourceOptions, context, this.authUrl.bind(this));

      if (authValidationResult.status === 'needs_oauth') return authValidationResult as any;

      const conn = await this.getConnectionWithValidatedAuth(sourceOptions, queryOptions, context);
      result = await this.executeOperation(conn, queryOptions);
    } else {
      const conn = await this.getConnection(sourceOptions, queryOptions);
      result = await this.executeOperation(conn, queryOptions);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  private async executeOperation(conn: any, queryOptions: QueryOptions) {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'soql': {
          const query = queryOptions.soql_query;
          result = await conn.query(query);
          break;
        }
        case 'crud': {
          const actiontype = queryOptions.actiontype;
          const resource_id = queryOptions.resource_id;
          const resource_body = queryOptions.resource_body;

          switch (actiontype) {
            case 'retrieve':
              response = await conn.sobject('Account').retrieve(resource_id);
              result = response;
              break;

            case 'create':
              response = await conn.sobject('Account').create(resource_body);
              result = response;
              break;

            case 'update':
              response = await conn.sobject('Account').update({ Id: resource_id, ...resource_body });
              result = response;
              break;

            case 'delete':
              response = await conn.sobject('Account').destroy(resource_id);
              result = response;
              break;

            default:
              throw new QueryError('Invalid CRUD operation', 'Please specify a valid operation', {});
          }
          break;
        }
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return result;
  }

  async getConnectionWithValidatedAuth(sourceOptions: SourceOptions, queryOptions: QueryOptions, context) {
    try {
      const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(sourceOptions);
      const tokenData = this.getTokenDataFromValidatedSource(sourceOptions, context);
      const accessToken = tokenData.access_token;
      const instanceUrl = tokenData.instance_url;

      if (!instanceUrl) {
        throw new Error('Instance URL is missing from token data in salesforce');
      }

      const oauth2 = new jsforce.OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
      });

      const conn = new jsforce.Connection({
        oauth2: oauth2,
        instanceUrl: instanceUrl,
        accessToken: accessToken,
      });
      return conn;
    } catch (error) {
      throw new QueryError('Connection Error in Salesforce with validated auth', error.message, {});
    }
  }

  private getTokenDataFromValidatedSource(sourceOptions: SourceOptions, context): any {
    if (sourceOptions.tokenData) {
      if (
        sourceOptions.multiple_auth_enabled &&
        Array.isArray(sourceOptions.tokenData) &&
        sourceOptions.tokenData.length > 0
      ) {
        const userTokenData = sourceOptions.tokenData.find((token) => token.user_id === context.user.id);
        if (!userTokenData) throw new Error('No token data for the particular UserId');
        if (userTokenData) return userTokenData;
      } else if (sourceOptions.tokenData) {
        return sourceOptions.tokenData;
      }
    }

    throw new Error('No token data found');
  }

  async getConnection(sourceOptions: SourceOptions, queryOptions: QueryOptions) {
    try {
      const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(sourceOptions);
      const instanceUrl = sourceOptions.instance_url;
      const access_token = sourceOptions.access_token;

      const oauth2 = new jsforce.OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
      });

      const conn = new jsforce.Connection({
        oauth2: oauth2,
        instanceUrl: instanceUrl,
        accessToken: access_token,
      });
      return conn;
    } catch (error) {
      throw new QueryError('Connection Error in Salesforce', error.message, {});
    }
  }

  authUrl(source_options): string {
    const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(source_options);
    if (!client_id || !client_secret || !redirect_uri) {
      throw new Error('OAuth2 client credentials are missing from authUrl');
    }
    const oauth2 = new jsforce.OAuth2({
      clientId: client_id,
      clientSecret: 'authurl',
      redirectUri: redirect_uri,
    });
    let authorizationUrl = oauth2.getAuthorizationUrl({
      scope: source_options.scopes,
    });
    // Note: Prompt for login each time, even if it's not multi-user auth ( Skip Salesforce session for Oauth flow )
    // if (source_options.multiple_auth_enabled) {
    authorizationUrl += '&prompt=login';

    return authorizationUrl;
  }

  async accessDetailsFrom(authCode: string, source_options, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
        ['instance_url', ''],
      ];
    }

    const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(source_options);
    if (!client_id || !client_secret || !redirect_uri) {
      throw new Error('OAuth2 client credentials are missing from accessDetailsFrom in salesforce');
    }

    const oauth2 = new jsforce.OAuth2({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirect_uri,
    });
    const conn = new jsforce.Connection({ oauth2: oauth2 });

    try {
      await conn.authorize(authCode);
    } catch (error) {
      throw new QueryError('Authorization Error', error.message, {});
    }

    const authDetails = [];
    if (conn['accessToken']) {
      authDetails.push(['access_token', conn['accessToken']]);
    }
    if (conn['refreshToken']) {
      authDetails.push(['refresh_token', conn['refreshToken']]);
    }
    if (conn['instanceUrl']) {
      authDetails.push(['instance_url', conn['instanceUrl']]);
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
    const oauth_type = this.getOptionValue(options.oauth_type);
    let client_id = this.getOptionValue(options.client_id);
    let client_secret = this.getOptionValue(options.client_secret);

    if (oauth_type === 'tooljet_app') {
      client_id = process.env.SALESFORCE_CLIENT_ID;
      client_secret = process.env.SALESFORCE_CLIENT_SECRET;
    }

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirect_uri = `${fullUrl}oauth2/authorize`;

    return { client_id, client_secret, redirect_uri };
  }
}
