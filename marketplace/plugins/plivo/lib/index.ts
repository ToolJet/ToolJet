import { QueryError, QueryService, QueryResult } from '@tooljet-marketplace/common';
const plivo = require('plivo');

export default class PlivoService implements QueryService {
  getClient(authId: string, authToken: string): any {
    return new plivo.Client(authId, authToken);
  }

  async run(sourceOptions: any, queryOptions: any): Promise<QueryResult> {
    let result = {};

    try {
      const client = this.getClient(sourceOptions.authId, sourceOptions.authToken);

      if (queryOptions.operation === 'send_sms') {
        result = await client.messages.create(queryOptions.from, queryOptions.to, queryOptions.body);
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
