import { Injectable } from '@nestjs/common';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
const got = require('got');

@Injectable()
export default class SlackQueryService implements QueryService {

  authUrl(): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    const tooljetHost = process.env.TOOLJET_HOST;
    return `https://slack.com/oauth/v2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${tooljetHost}/oauth2/authorize`;
  }

  async accessDetailsFrom(authCode: string): Promise<object> {
    const accessTokenUrl = 'https://slack.com/api/oauth.v2.access'
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const tooljetHost = process.env.TOOLJET_HOST;
    const redirectUri = `${tooljetHost}/oauth2/authorize`;

    const body = `code=${authCode}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}`;

    const response = await got(accessTokenUrl, { 
      method: 'post', 
      body,
      headers: {'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const result = JSON.parse(response.body);

    if(response.statusCode !== 200) {
      throw Error('could not connect to Slack');
    }

    let authDetails = [];

    if(result['access_token']) {
      authDetails.push(['access_token', result['access_token']]);
    }

    if(result['refresh_token']) {
      authDetails.push(['refresh_token', result['refresh_token']]);
    }

    return authDetails;
  }

  authHeader(token: string): object {
    return { Authorization: `Bearer ${token}` }
  }


  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    let result = { };
    let response = null;
    const operation = queryOptions.operation;
    const accessToken = sourceOptions['access_token'];

    try {
      switch (operation) {
        case 'list_users':
          response = await got('https://slack.com/api/users.list', { 
            method: 'get', 
            headers: this.authHeader(accessToken)
          });
          
          result = JSON.parse(response.body);
          break;

        case 'send_message':
          const body = {
            channel: queryOptions['channel'],
            text: queryOptions['message'],
            as_user: queryOptions['sendAsUser']
          }

          response = await got('https://slack.com/api/chat.postMessage', { 
            method: 'post', 
            json: body,
            headers: this.authHeader(accessToken)
          });
          
          result = JSON.parse(response.body);
          break;  
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result
    }
  }

}
