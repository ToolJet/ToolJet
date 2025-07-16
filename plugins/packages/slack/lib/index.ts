import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import got, { Headers } from 'got';
import { SourceOptions, QueryOptions } from './types';

export default class SlackQueryService implements QueryService {
  authUrl(options): string {
    const source_options = Object.entries(options).map(([key, value]: [string, any]) => {
      return { key, ...value };
    });
    const { useCredsFromEnv, useCredsFromDatasourceConfiguration, clientIdValue } =
      this.shouldUseCredentialsFromEnv(source_options);

    let clientId = null;
    if (useCredsFromEnv) clientId = process.env.SLACK_CLIENT_ID;
    if (useCredsFromDatasourceConfiguration) clientId = clientIdValue;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    return `https://slack.com/oauth/v2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${fullUrl}oauth2/authorize`;
  }

  shouldUseCredentialsFromEnv(sourceOptions = []): {
    useCredsFromEnv: boolean;
    useCredsFromDatasourceConfiguration: boolean;
    clientSecretValue: string | null;
    clientIdValue: string | null;
  } {
    let useCredsFromEnv = false;
    let useCredsFromDatasourceConfiguration = false;
    let clientIdValue = null;
    let clientSecretValue = null;

    sourceOptions.forEach((sourceOption) => {
      if (sourceOption.key === 'credential_source') {
        if (sourceOption.value === 'from_env') useCredsFromEnv = true;
        if (sourceOption.value === 'from_datasource_configuration') useCredsFromDatasourceConfiguration = true;
      }
      if (sourceOption.key === 'client_id') clientIdValue = sourceOption.value;
      if (sourceOption.key === 'client_secret') clientSecretValue = sourceOption.value;
    });
    return { useCredsFromEnv, useCredsFromDatasourceConfiguration, clientIdValue, clientSecretValue };
  }

  async accessDetailsFrom(authCode: string, options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const accessTokenUrl = 'https://slack.com/api/oauth.v2.access';
    const { useCredsFromEnv, useCredsFromDatasourceConfiguration, clientIdValue, clientSecretValue } =
      this.shouldUseCredentialsFromEnv(options);
    let clientId = null;
    let clientSecret = null;
    if (useCredsFromEnv) {
      clientId = process.env.SLACK_CLIENT_ID;
      clientSecret = process.env.SLACK_CLIENT_SECRET;
    }
    if (useCredsFromDatasourceConfiguration) {
      clientId = clientIdValue;
      clientSecret = clientSecretValue;
    }

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

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
