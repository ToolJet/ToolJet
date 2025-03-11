import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class Mailgun implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result: any = {};
    let response = null;
    let BASE_URL = '';
    const { operation, send_mail_to, send_mail_from, subject, text, html } = queryOptions;
    const { domain, api_key, eu_hosted } = sourceOptions;

    if (eu_hosted) {
      BASE_URL = 'https://api.eu.mailgun.net';
    } else BASE_URL = 'https://api.mailgun.net';

    const form = new FormData();
    send_mail_to.forEach((item) => form.append('to[]', item));
    form.append('from', send_mail_from);
    form.append('subject', subject);
    form.append('text', text);
    if (html && html.length > 0) {
      form.append('html', html);
    }

    try {
      if (!domain) {
        throw new Error('Missing required domain');
      }
      if (!api_key) {
        throw new Error('Missing required api key');
      }
      switch (operation) {
        case 'mail_service': {
          response = await fetch(`${BASE_URL}/v3/${domain}/messages`, {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + Buffer.from(`api:${api_key}`).toString('base64'),
            },
            body: form,
          });
          const textResponse = await response.text();
          try {
            result = JSON.parse(textResponse);
          } catch (error) {
            result = textResponse;
          }

          if (response.status !== 200) {
            throw new Error(`${result?.message}`);
          }
          break;
        }
      }
    } catch (error) {
      throw new QueryError(`Query could not be completed ${error}`, error, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }
}
