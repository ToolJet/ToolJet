import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import jsforce from 'jsforce';

export default class Salesforce implements QueryService {

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    return {
      status: 'ok',
      data: {},
    };
  }

  jsforceAuthUrl(): string {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    if (!clientId || !clientSecret) {
      throw Error('You need to define Salesforce OAuth environment variables');
    }
    const Oauth2 = new jsforce.OAuth2({
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: redirectUri,
    });
    return redirectUri;
  }
  let salesforce = new Salesforce();
  const redirectUri = salesforce.jsforceAuthUrl();
  process.env.JSFORCE_REDIRECT_URI = redirectUri;

}
