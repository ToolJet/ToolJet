import { QueryError, QueryService, QueryResult } from '@tooljet-marketplace/common';
import { QueryOptions, SourceOptions } from './types';
const plivo = require('plivo');

const ALLOWED_ANSWER_METHODS = ['GET', 'POST'];

export default class PlivoService implements QueryService {
  getClient(authId: string, authToken: string): any {
    return new plivo.Client(authId, authToken);
  }
  private assertRequired(value: unknown, fieldLabel: string): string {
    const str = typeof value === 'string' ? value.trim() : '';
    if (!str) {
      throw new QueryError(`${fieldLabel} is required`, `${fieldLabel} must not be empty`, {});
    }
    return str;
  }

  private async sendSms(client: any, queryOptions: QueryOptions) {
    const from = this.assertRequired(queryOptions.from, 'From Number');
    const to = this.assertRequired(queryOptions.to, 'To Number');
    const body = this.assertRequired(queryOptions.body, 'Body');
    return client.messages.create(from, to, body);
  }

  private async makeCall(client: any, queryOptions: QueryOptions) {
    const from = this.assertRequired(queryOptions.from, 'From Number');
    const to = this.assertRequired(queryOptions.to, 'To Number');
    const answerUrl = this.assertRequired(queryOptions.answerUrl, 'Answer URL');

    const answerMethod = (queryOptions.answerMethod || 'POST').toUpperCase();
    if (!ALLOWED_ANSWER_METHODS.includes(answerMethod)) {
      throw new QueryError(
        'Invalid Answer Method',
        `Answer Method must be one of: ${ALLOWED_ANSWER_METHODS.join(', ')}`,
        {}
      );
    }

    return client.calls.create(from, to, answerUrl, { answerMethod });
  }


    async run(
      sourceOptions: SourceOptions & { authId: string; authToken: string },queryOptions: QueryOptions
    ): Promise<QueryResult> {

    let result = {};

    try {
      const client = this.getClient(sourceOptions.authId, sourceOptions.authToken);

      switch (queryOptions.operation) {
        case 'send_sms':
          result = await this.sendSms(client, queryOptions);
          break;
        case 'make_call':
          result = await this.makeCall(client, queryOptions);
          break;
        default:
          throw new QueryError('Invalid operation', `Unsupported operation: ${queryOptions.operation}`, {});
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
