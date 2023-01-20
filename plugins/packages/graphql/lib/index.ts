import { HTTPError } from 'got';
import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import got from 'got';
import { SourceOptions, QueryOptions } from './types';

export default class GraphqlQueryService implements QueryService {
  constructor(private sendRequest = got) {}

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    let result = {};

    const url = sourceOptions.url;
    const { query, variables } = queryOptions;
    // Query takes precedence over source.
    const headers = {
      ...Object.fromEntries(sourceOptions['headers']),
      ...Object.fromEntries(queryOptions['headers'] ?? []),
    };

    const searchParams = Object.fromEntries(sourceOptions['url_params']);

    // Remove invalid entries from the headers and searchParams objects
    Object.keys(headers).forEach((key) => (headers[key] === '' ? delete headers[key] : {}));
    Object.keys(searchParams).forEach((key) => (searchParams[key] === '' ? delete searchParams[key] : {}));

    const json = {
      query,
      variables: variables ? JSON.parse(variables) : {},
    };

    try {
      const response = await this.sendRequest(url, {
        method: 'post',
        headers,
        searchParams,
        json,
      });
      result = JSON.parse(response.body);
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
