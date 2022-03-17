import { QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got';

export default class influxdb implements QueryService {
  authHeader(token: string): Headers {
    return {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;
    const apiKey = sourceOptions.api_token;

    try {
      switch (operation) {
        case 'list_buckets': {
          response = await got(`http://localhost:8086/api/v2/buckets`, {
            method: 'get',
            headers: this.authHeader(apiKey),
          });

          result = JSON.parse(response.body);
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
