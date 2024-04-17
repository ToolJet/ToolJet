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
    const conn = new jsforce.Connection({ oauth2: oauth2 });
    const response = await conn.authorize(authCode);
    const authDetails = [];
    authDetails.push(['response', response]);
    return authDetails;
  }
}
