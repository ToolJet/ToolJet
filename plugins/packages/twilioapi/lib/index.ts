import { QueryError, QueryResult,  QueryService} from 'common';


import { Twilio } from 'twilio';

export default class TwilioQueryService implements QueryService {
  getClient(accountSid: string, authToken: string): any {
    return new Twilio(accountSid, authToken);
  }

  async run(sourceOptions: any = {}, queryOptions: any = {}, dataSourceId: string): Promise<QueryResult> {
    let result = {};

    try {
      if (queryOptions.operation && queryOptions.operation === 'send_sms') {
        result = await this.getClient(sourceOptions.accountSid, sourceOptions.authToken)
          .messages.create({
            body: queryOptions.body,
            messagingServiceSid: sourceOptions.messagingServiceSid,
            to: queryOptions.toNumber,
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
