import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { Twilio } from 'twilio';
import { SourceOptions, QueryOptions } from './types';

export default class TwilioQueryService implements QueryService {
  getClient(accountSid: string, authToken: string): any {
    return new Twilio(accountSid, authToken);
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};

    try {
      if (queryOptions.operation && queryOptions.operation === 'send_sms') {
        result = await this.getClient(sourceOptions.account_sid, sourceOptions.auth_token)
          .messages.create({
            body: queryOptions.body,
            messagingServiceSid: sourceOptions.messaging_service_sid,
            to: queryOptions.to_number,
          })
          .then((message) => message);
      }
    } catch (error) {
      console.log(error.response);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
