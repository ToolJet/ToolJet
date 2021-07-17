import { Injectable } from '@nestjs/common';
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

  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {

    return {
      status: 'ok',
      data: {}
    }
  }
}
