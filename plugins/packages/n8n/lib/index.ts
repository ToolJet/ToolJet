import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { QueryOptions, SourceOptions } from './types';
import got, { HTTPError, OptionsOfTextResponseBody } from 'got';

const constructHeaders = (sourceOptions: SourceOptions) => {
  const headers = {};
  if (sourceOptions.auth_type === 'header') {
    headers[sourceOptions.name] = sourceOptions.value;
  }
  return headers;
};

const extractJsonData = (content: any) => {
  return typeof content === 'string' ? JSON.parse(content) : content;
};

export default class N8n implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const authType = sourceOptions.auth_type;
    const headers = constructHeaders(sourceOptions);

    const operation = queryOptions.method;
    const url = queryOptions.url;
    const url_params = queryOptions.url_params;
    const body = queryOptions.body;

    let result = {};

    // Remove invalid headers from the headers object
    Object.keys(headers).forEach((key) => (headers[key] === '' ? delete headers[key] : {}));

    const paramsContent = url_params ? extractJsonData(url_params) : '';
    const bodyContent = body ? extractJsonData(body) : '';

    const constructPayload = (method: string): OptionsOfTextResponseBody => {
      return {
        method: method === 'post' ? 'POST' : 'GET',
        headers: headers,
        username: authType === 'basic' && sourceOptions.username,
        password: authType === 'basic' && sourceOptions.password,
        searchParams: paramsContent,
        json: method === 'post' ? bodyContent : undefined,
      };
    };

    try {
      switch (operation) {
        case 'post': {
          if (bodyContent === '') {
            throw new Error('Please provide body content');
          }
          const response = await got(url, constructPayload('post'));
          result = JSON.parse(response.body);
          break;
        }
        case 'get': {
          const response = await got(url, constructPayload('get'));
          result = JSON.parse(response.body);
          break;
        }
        default: {
          throw new Error('Select a method');
        }
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HTTPError) {
        result = {
          code: error.code,
        };
      }
      throw new QueryError('Query could not be completed', error.message, result);
    }

    return {
      status: 'ok',
      data: result,
    };
  }
}
