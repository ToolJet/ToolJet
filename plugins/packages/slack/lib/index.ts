import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import got, { Headers } from 'got';
import { SourceOptions, QueryOptions } from './types';

export default class SlackQueryService implements QueryService {
  authUrl(): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    const tooljetHost = process.env.TOOLJET_HOST;
    return `https://slack.com/oauth/v2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${tooljetHost}/oauth2/authorize`;
  }

  async accessDetailsFrom(authCode: string): Promise<object> {
    const accessTokenUrl = 'https://slack.com/api/oauth.v2.access';
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const tooljetHost = process.env.TOOLJET_HOST;
    const redirectUri = `${tooljetHost}/oauth2/authorize`;

    const body = `code=${authCode}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`;

    const response = await got(accessTokenUrl, {
      method: 'post',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const result = JSON.parse(response.body);

    if (response.statusCode !== 200) {
      throw Error('could not connect to Slack');
    }

    const authDetails = [];

    if (result['access_token']) {
      authDetails.push(['access_token', result['access_token']]);
    }

    if (result['refresh_token']) {
      authDetails.push(['refresh_token', result['refresh_token']]);
    }

    return authDetails;
  }

  authHeader(token: string): Headers {
    return { Authorization: `Bearer ${token}` };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const accessToken = sourceOptions.access_token;

    try {
      switch (operation) {
        case 'list_users':
          response = await got('https://slack.com/api/users.list', {
            method: 'get',
            headers: this.authHeader(accessToken),
          });

          result = JSON.parse(response.body);
          break;

        case 'send_message': {
          if (sourceOptions.access_type === 'chat:write') {
            const body = {
              channel: queryOptions.channel,
              text: queryOptions.message,
              as_user: queryOptions.sendAsUser,
            };

            response = await got('https://slack.com/api/chat.postMessage', {
              method: 'post',
              json: body,
              headers: this.authHeader(accessToken),
            });

            result = JSON.parse(response.body);
          } else {
            result = {
              ok: false,
              error: 'You do not have the required permissions to perform this operation',
            };
          }
          break;
        }

        case 'list_messages':
          response = await got('https://slack.com/api/conversations.history', {
            method: 'post',
            form: {
              channel: queryOptions.channel,
              limit: queryOptions.limit || 100,
              cursor: queryOptions.cursor || '',
            },
            headers: this.authHeader(accessToken),
          });

          result = JSON.parse(response.body);
          break;
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
