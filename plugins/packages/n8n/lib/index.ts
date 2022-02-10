import { QueryError, QueryResult, QueryService, ConnectionTestResult, parseJson } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got from 'got';
import { HTTPError } from 'got';

export default class N8n implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const url = sourceOptions.host;
    const operation = queryOptions.operation;
    const url_params = queryOptions.url_params;
    const body = queryOptions.body;
    const headers = Object.fromEntries(sourceOptions['headers']);
    let result = {};

    // Remove invalid headers from the headers object
    Object.keys(headers).forEach((key) => (headers[key] === '' ? delete headers[key] : {}));

    const paramsContent = url_params ? JSON.parse(url_params) : '';
    const bodyContent =  url_params ? JSON.parse(url_params) : '';
    
    try {
      switch(operation){
        case 'post' : {
          const response = await got(url, {
            method: 'post',
            headers,
            searchParams: paramsContent,
            json: bodyContent,
          });
          result = JSON.parse(response.body);
          break;
        }
        case 'get': {
          const response = await got(url, {
            method: 'get',
            headers,
            searchParams: paramsContent,
          });
          result = JSON.parse(response.body);
          break;
        }
        default : {
          throw new Error("Select an operation");
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
