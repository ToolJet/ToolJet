import { QueryError, QueryResult, QueryService, OAuthUnauthorizedClientError } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got';

interface ISanitizeObject {
  [key: string]: string;
}

export default class Zendesk implements QueryService {
  private sanitizeOptions(options: Array<object>): ISanitizeObject {
    const findOption = (opts: any[], key: string) => opts.find((opt) => opt['key'] === key);

    return {
      clientId: findOption(options, 'client_id')['value'],
      clientSecret: findOption(options, 'client_secret')['value'],
      subdomain: findOption(options, 'subdomain')['value'],
      scope: findOption(options, 'access_type')['value'],
    };
  }

  private authHeader(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async accessDetailsFrom(authCode: string, options: Array<object>): Promise<object> {
    const { clientId, clientSecret, subdomain, scope } = this.sanitizeOptions(options);

    const accessTokenUrl = `https://${subdomain}.zendesk.com/oauth/tokens`;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const grantType = 'authorization_code';

    const data = {
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
      redirect_uri: redirectUri,
      scope: scope,
    };

    const authDetails = [];

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        json: data,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw Error('could not connect to Zendesk');
      }

      if (result['access_token'] && result['token_type'] === 'bearer') {
        authDetails.push(['access_token', result['access_token']]);
      }

      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      console.log(error?.response?.body);
      throw Error('could not connect to Zendesk');
    }

    return authDetails;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const subdomain = sourceOptions['subdomain'];
    const accessToken = sourceOptions['access_token'];
    const url = `https://${subdomain}.zendesk.com/api/v2`;

    try {
      switch (operation) {
        case 'read_tickets':
          response = await got(`${url}/tickets.json`, {
            method: 'get',
            headers: this.authHeader(accessToken),
          });
          result = JSON.parse(response.body);
          break;

        case 'list_users':
          response = await got(`${url}/users`, {
            method: 'get',
            headers: this.authHeader(accessToken),
          });
          result = JSON.parse(response.body);
          break;

        case 'read_requested_tickets':
          response = await got(`${url}/users/${queryOptions['user_id']}/tickets/requested`, {
            method: 'get',
            headers: this.authHeader(accessToken),
          });
          result = JSON.parse(response.body);
          break;

        case 'show_ticket':
          response = await got(`${url}/tickets/${queryOptions['ticket_id']}`, {
            method: 'get',
            headers: this.authHeader(accessToken),
          });
          result = JSON.parse(response.body);
          break;

        case 'get_user':
          response = await got(`${url}/users/${queryOptions['user_id']}`, {
            method: 'get',
            headers: this.authHeader(accessToken),
          });
          result = JSON.parse(response.body);
          break;

        case 'get_profile':
          response = await got(`${url}/users/${queryOptions['user_id']}/profiles`, {
            method: 'get',
            headers: this.authHeader(accessToken),
          });
          result = JSON.parse(response.body);
          break;

        case 'update_ticket':
          response = await got(`${url}/tickets/${queryOptions['ticket_id']}.json`, {
            method: 'put',
            headers: this.authHeader(accessToken),
            body: JSON.stringify(queryOptions['body']),
          });
          result = JSON.parse(response.body);

          break;

        case 'search':
          response = await got(`${url}/search.json`, {
            method: 'get',
            headers: this.authHeader(accessToken),
            searchParams: {
              query: queryOptions['query'],
            },
          });
          result = JSON.parse(response.body);
          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error.response);

      if (error?.response?.statusCode === 401) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error.message, { ...error });
      }
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
