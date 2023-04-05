import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class Mailgun implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};
    let response = null;
    const { operation } = queryOptions;

    try {
      switch (operation) {
        case 'mail_service': {
          const form = new FormData();
          form.append('from', 'adish@tooljet.com');
          form.append('to', 'stepinfwd@gmail.com');
          form.append('subject', 'Hello');
          form.append('text', 'Testing some Mailgun awesomness!');
          response = await fetch(`https://api.mailgun.net/v3/${sourceOptions.domain}/messages`, {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + btoa(`api:${sourceOptions.api_key}`),
            },
            body: form,
          });
          console.log('respxx', response);

          result = response.body;
          break;
        }
      }
    } catch (error) {
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
