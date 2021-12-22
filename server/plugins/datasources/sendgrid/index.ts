import { Injectable } from '@nestjs/common';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryResult } from 'src/modules/data_sources/query_result.type';
import { QueryService } from 'src/modules/data_sources/query_service.interface';
import * as SendGrid from '@sendgrid/mail';
import { EmailOptions } from './sendgrid.interface';

@Injectable()
export default class SendGridQueryService implements QueryService {
  async run(sourceOptions: any, queryOptions: any, dataSourceId: string): Promise<QueryResult> {
    if (!(queryOptions && sourceOptions.api_key)) {
      throw new QueryError('Query could not be completed as API key is not set', 'Missing API key', {});
    }

    SendGrid.setApiKey(sourceOptions.api_key);

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
      result = await SendGrid.send(sendgridEmailOptions);
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
