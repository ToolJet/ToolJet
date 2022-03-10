import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import sgMail from '@sendgrid/mail';
import { EmailOptions, SourceOptions, QueryOptions } from './types';

export default class SendGridQueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    if (!(queryOptions && sourceOptions.api_key)) {
      throw new QueryError('Query could not be completed as API key is not set', 'Missing API key', {});
    }

    sgMail.setApiKey(sourceOptions.api_key);

    let result = {};
    const sendgridEmailOptions: EmailOptions = {
      to: queryOptions.send_mail_to,
      from: queryOptions.send_mail_from,
      subject: queryOptions.subject,
      text: queryOptions.text,
      isMultiple: queryOptions.multiple_recipients ?? false,
    };

    if (queryOptions.html && queryOptions.html.length > 0) {
      sendgridEmailOptions.html = queryOptions.html;
    }

    try {
      result = await sgMail.send(sendgridEmailOptions);
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
