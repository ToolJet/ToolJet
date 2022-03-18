import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions, EmailOptions } from './types';
import MailgunSdk from 'mailgun.js';
import FormData from 'form-data';

export default class Mailgun implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    if (!(queryOptions && sourceOptions.api_key)) {
      throw new QueryError('Query could not be completed as API key is not set', 'Missing API key', {});
    }

    const sdk = new MailgunSdk(FormData);
    const mailgunOptions = { username: 'api', key: sourceOptions.api_key, url: null };
    if (sourceOptions.eu_hosted) {
      mailgunOptions.url = 'https://api.eu.mailgun.net';
    }
    const mailGunClient = sdk.client(mailgunOptions);

    let result = {};
    const emailOptions: EmailOptions = {
      to: queryOptions.send_mail_to,
      from: queryOptions.send_mail_from,
      subject: queryOptions.subject,
      text: queryOptions.text,
    };

    if (queryOptions.html && queryOptions.html.length > 0) {
      emailOptions.html = queryOptions.html;
    }

    try {
      result = await mailGunClient.messages.create(sourceOptions.domain, emailOptions);
    } catch (error) {
      console.error(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }
}
