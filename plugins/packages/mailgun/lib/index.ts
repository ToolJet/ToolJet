import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class Mailgun implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result: any = {};
    let response = null;
    let BASE_URL = '';
    const { operation } = queryOptions;

    if (sourceOptions.eu_hosted) {
      BASE_URL = 'https://api.eu.mailgun.net';
    } else BASE_URL = 'https://api.mailgun.net';

    const form = new FormData();
    queryOptions.send_mail_to.forEach((item) => form.append('to[]', item));
    form.append('from', queryOptions.send_mail_from);
    form.append('subject', queryOptions.subject);
    form.append('text', queryOptions.text);
    if (queryOptions.html && queryOptions.html.length > 0) {
      form.append('html', queryOptions.html);
    }

    try {
      switch (operation) {
        case 'mail_service': {
          response = await fetch(`${BASE_URL}/v3/${sourceOptions.domain}/messages`, {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + Buffer.from(`api:${sourceOptions.api_key}`).toString('base64'),
            },
            body: form,
          });
          result = await response.json();

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
