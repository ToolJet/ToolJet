import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import jsforce from 'jsforce';

export default class Salesforce implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    //sourceOptions.redirect_uri = this.authUrl();
    return {
      status: 'ok',
      data: {},
    };
  }

  authUrl(source_options): string {
    console.log(source_options, 'source_options from authUrl');
    const client_id = source_options.client_id.value;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const client_secret = source_options.client_secret.value;
    const oauth2 = new jsforce.OAuth2({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirectUri,
    });
    const authorizationUrl = oauth2.getAuthorizationUrl({
      scope: 'full',
    });
    return authorizationUrl;
  }
  async accessDetailsFrom(authCode: string, source_options): Promise<object> {
    let client_id = '';
    let client_secret = '';

    for (const item of source_options) {
      if (item.key === 'client_id') {
        client_id = item.value;
      }
      if (item.key === 'client_secret') {
        client_secret = item.value;
      }
    }
    console.log(client_id, 'client_id');
    console.log(client_secret, 'client_secret');
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const oauth2 = new jsforce.OAuth2({
      clientId: client_id,
      clientSecret: client_secret,
      redirectUri: redirectUri,
    });
    const conn = new jsforce.Connection({ oauth2: oauth2 });
    const response = await conn.authorize(authCode);
    console.log(conn.accessToken, 'access token');
    console.log(conn.refreshToken, 'refresh token');
    const authDetails = [];
    authDetails.push(['access_token', conn['accessToken']]);
    return authDetails;
  }
}
